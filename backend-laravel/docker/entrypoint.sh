#!/bin/sh
set -e

cd /var/www/html

# Configuração vem das variáveis de ambiente do docker-compose.
touch .env

# APP_KEY: se não foi informada, gera uma vez e guarda no volume de storage
if [ -z "$APP_KEY" ]; then
  KEY_FILE=storage/app/.app_key
  if [ ! -s "$KEY_FILE" ]; then
    php -r 'echo "base64:".base64_encode(random_bytes(32));' > "$KEY_FILE"
  fi
  export APP_KEY="$(cat "$KEY_FILE")"
fi

# Pastas do storage (o volume pode chegar vazio na primeira vez)
mkdir -p storage/app/public storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs
chown -R www-data:www-data storage bootstrap/cache

echo "Aguardando o banco de dados em ${DB_HOST}:${DB_PORT}..."
i=0
until php -r 'try { new PDO("mysql:host=".getenv("DB_HOST").";port=".getenv("DB_PORT"), getenv("DB_USERNAME"), getenv("DB_PASSWORD")); } catch (Throwable $e) { exit(1); }'; do
  i=$((i+1))
  if [ "$i" -ge 60 ]; then echo "Banco não respondeu em 2 minutos."; exit 1; fi
  sleep 2
done

php artisan config:clear >/dev/null
php artisan migrate --force

# Dados de demonstração só na primeira vez (banco vazio) e se SEED_DEMO=true
if [ "${SEED_DEMO:-false}" = "true" ]; then
  COUNT=$(php -r '$p = new PDO("mysql:host=".getenv("DB_HOST").";port=".getenv("DB_PORT").";dbname=".getenv("DB_DATABASE"), getenv("DB_USERNAME"), getenv("DB_PASSWORD")); echo $p->query("select count(*) from associations")->fetchColumn();')
  if [ "$COUNT" = "0" ]; then
    echo "Criando dados de demonstração..."
    php artisan db:seed --force
  fi
fi

php artisan config:cache
php artisan route:cache

exec "$@"
