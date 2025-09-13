#!/bin/sh
set -e

# Executa a aplicação Java, passando as propriedades de sistema.
# O shell irá substituir as variáveis ($PGHOST, etc.) pelos seus valores.
java -Dspring.datasource.url=jdbc:postgresql://${PGHOST}:${PGPORT}/${PGDATABASE} \
     -Dspring.datasource.username=${PGUSER} \
     -Dspring.datasource.password=${PGPASSWORD} \
     -jar app.jar