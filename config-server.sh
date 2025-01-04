#!/bin/bash

set -e  # Detener el script si ocurre un error

export DEBIAN_FRONTEND=noninteractive

# Verifica que se haya proporcionado la dirección IP
if [ -z "$1" ]; then
  echo "Error: No se proporcionó la dirección IP como argumento."
  exit 1
fi

HOST_IP=$1

# Actualizar repositorios
apt-get update

# Instalar dependencias necesarias
apt-get install -y ca-certificates curl ufw

# Configurar UFW para permitir Nginx
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload

# Crear directorio para keyrings
install -m 0755 -d /etc/apt/keyrings

# Descargar la clave GPG de Docker
curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

# Agregar el repositorio de Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
$(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Actualizar repositorios de Docker
apt-get update

# Instalar Docker, Docker Compose y Nginx
DEBIAN_FRONTEND=noninteractive apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin nginx

# Eliminar la configuración predeterminada de Nginx
if [ -L /etc/nginx/sites-enabled/default ]; then
  echo "Eliminando enlace simbólico predeterminado..."
  rm /etc/nginx/sites-enabled/default
fi

if [ -f /etc/nginx/sites-available/default ]; then
  echo "Eliminando archivo de configuración predeterminado..."
  rm /etc/nginx/sites-available/default
fi

# Crear directorio para certificados SSL
mkdir -p /etc/ssl/self-signed

# Generar un certificado SSL autofirmado con la dirección IP del host
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/self-signed/selfsigned.key \
    -out /etc/ssl/self-signed/selfsigned.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=$HOST_IP"

# Crear parámetros Diffie-Hellman
openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048

# Crear el archivo de configuración de Nginx
cat <<EOL > /etc/nginx/sites-available/app
server {
    listen 80;
    server_name $HOST_IP;

    # Redirigir todo el tráfico HTTP a HTTPS
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name $HOST_IP;

    ssl_certificate /etc/ssl/self-signed/selfsigned.crt;
    ssl_certificate_key /etc/ssl/self-signed/selfsigned.key;
    ssl_dhparam /etc/ssl/certs/dhparam.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location /api {
        proxy_pass http://127.0.0.1:3001/api;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOL

# Crear un enlace simbólico para habilitar la configuración en Nginx
ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/app

# Habilitar y arrancar Nginx
systemctl enable nginx
systemctl start nginx

# Probar la configuración de Nginx
nginx -t

# Subir y ejecutar Docker Compose
docker compose -f /root/docker-compose.yml up -d