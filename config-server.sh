#!/bin/bash

set -e  # Detener el script si ocurre un error

export DEBIAN_FRONTEND=noninteractive
LOG_FILE="/root/setup.log"

# Función para registrar mensajes
log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Verifica que se haya proporcionado la dirección IP
if [ -z "$1" ]; then
  log "Error: No se proporcionó la dirección IP como argumento."
  exit 1
fi

HOST_IP=$1

log "Inicio del script de configuración."

# Actualizar repositorios
log "Actualizando repositorios..."
apt-get update >> "$LOG_FILE" 2>&1

# Instalar dependencias necesarias
log "Instalando dependencias necesarias..."
apt-get install -y ca-certificates curl ufw >> "$LOG_FILE" 2>&1

# Configurar UFW para permitir Nginx
log "Configurando UFW para permitir tráfico HTTP y HTTPS..."
ufw allow 80/tcp >> "$LOG_FILE" 2>&1
ufw allow 443/tcp >> "$LOG_FILE" 2>&1
ufw reload >> "$LOG_FILE" 2>&1

# Crear directorio para keyrings
log "Creando directorio para keyrings..."
install -m 0755 -d /etc/apt/keyrings >> "$LOG_FILE" 2>&1

# Descargar la clave GPG de Docker
log "Descargando la clave GPG de Docker..."
curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc >> "$LOG_FILE" 2>&1
chmod a+r /etc/apt/keyrings/docker.asc >> "$LOG_FILE" 2>&1

# Agregar el repositorio de Docker
log "Agregando el repositorio de Docker..."
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
$(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list >> "$LOG_FILE" 2>&1

# Actualizar repositorios de Docker
log "Actualizando repositorios de Docker..."
apt-get update >> "$LOG_FILE" 2>&1

# Instalar Docker, Docker Compose y Nginx
log "Instalando Docker, Docker Compose y Nginx..."
DEBIAN_FRONTEND=noninteractive apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin nginx >> "$LOG_FILE" 2>&1

# Eliminar la configuración predeterminada de Nginx
log "Eliminando la configuración predeterminada de Nginx..."
if [ -L /etc/nginx/sites-enabled/default ]; then
  log "Eliminando enlace simbólico predeterminado..."
  rm /etc/nginx/sites-enabled/default >> "$LOG_FILE" 2>&1
fi

if [ -f /etc/nginx/sites-available/default ]; then
  log "Eliminando archivo de configuración predeterminado..."
  rm /etc/nginx/sites-available/default >> "$LOG_FILE" 2>&1
fi

# Crear directorio para certificados SSL
log "Creando directorio para certificados SSL..."
mkdir -p /etc/ssl/self-signed >> "$LOG_FILE" 2>&1

# Generar un certificado SSL autofirmado con la dirección IP del host
log "Generando un certificado SSL autofirmado..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/self-signed/selfsigned.key \
    -out /etc/ssl/self-signed/selfsigned.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=$HOST_IP" >> "$LOG_FILE" 2>&1

# Crear parámetros Diffie-Hellman
log "Creando parámetros Diffie-Hellman..."
openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048 >> "$LOG_FILE" 2>&1

# Crear el archivo de configuración de Nginx
log "Creando el archivo de configuración de Nginx..."
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
log "Creando un enlace simbólico para habilitar la configuración en Nginx..."
ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/app >> "$LOG_FILE" 2>&1

# Subir y ejecutar Docker Compose
log "Ejecutando Docker Compose..."
docker compose -f /root/docker-compose.yml up -d >> "$LOG_FILE" 2>&1

# Habilitar y arrancar Nginx
log "Habilitando y arrancando Nginx..."
systemctl enable nginx >> "$LOG_FILE" 2>&1
systemctl start nginx >> "$LOG_FILE" 2>&1

# Probar la configuración de Nginx
log "Probando la configuración de Nginx..."
nginx -t >> "$LOG_FILE" 2>&1

log "Script completado exitosamente."