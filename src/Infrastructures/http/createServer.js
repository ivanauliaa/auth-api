const Hapi = require('@hapi/hapi');
const { v4: uuid } = require('uuid');
const pino = require('pino');
const ClientError = require('../../Commons/exceptions/ClientError');
const DomainErrorTranslator = require('../../Commons/exceptions/DomainErrorTranslator');
const users = require('../../Interfaces/http/api/users');
const authentications = require('../../Interfaces/http/api/authentications');

const pinoOption = {
  enabled: !(process.env.NODE_ENV === 'test'),
  transport: {
    target: 'pino-pretty',
  },
};

const logger = process.env.NODE_ENV === 'production' ? pino() : pino(pinoOption);

const createServer = async (container) => {
  const server = Hapi.server({
    host: process.env.HOST,
    port: process.env.PORT,
  });

  await server.register([
    {
      plugin: users,
      options: {
        container,
      },
    },
    {
      plugin: authentications,
      options: {
        container,
      },
    },
  ]);

  server.route([
    {
      method: 'GET',
      path: '/',
      handler: () => ({
        value: 'Hello world! 2',
      }),
    },
    {
      method: 'GET',
      path: '/ping',
      handler: (request) => ({ value: 'pong' }),
    },
  ]);

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    const logObject = {
      requestId: uuid(),
      request: {
        endpoint: request.url.pathname,
        method: request.method.toUpperCase(),
        payload: request.payload,
      },
      response: {
        statusCode: response.statusCode,
        body: response.source,
      },
    };

    if (response.isBoom) {
      response.output.headers['X-Request-ID'] = logObject.requestId;
    } else {
      response.header('X-Request-ID', logObject.requestId);
    }

    if (response instanceof Error) {
      const translatedError = DomainErrorTranslator.translate(response);

      if (translatedError instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: translatedError.message,
        });
        newResponse.code(translatedError.statusCode);

        logger.error(logObject);
        newResponse.header('X-Request-ID', logObject.requestId);
        return newResponse;
      }

      if (!translatedError.isServer) {
        logObject.response = {
          statusCode: response.output.statusCode,
          body: response.output.payload,
        };

        logger.error(logObject);
        return h.continue;
      }

      logObject.response = {
        statusCode: 500,
        body: response,
      };

      const newResponse = h.response({
        status: 'error',
        message: 'terjadi kegagalan pada server kami',
      });
      newResponse.code(500);

      logger.error(logObject);
      newResponse.header('X-Request-ID', logObject.requestId);
      return newResponse;
    }

    logger.info(logObject);
    return h.continue;
  });

  return server;
};

module.exports = createServer;
