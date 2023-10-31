PGPASSWORD=${5} pg_dump -h ${1} -U ${2} -p ${3} -d ${4} > ${6}
