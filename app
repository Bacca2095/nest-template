server {
    listen 80;
    server_name _;

    # Redirigir todo el tráfico HTTP a HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name _; 

    ssl_certificate /etc/ssl/self-signed/selfsigned.crt;
    ssl_certificate_key /etc/ssl/self-signed/selfsigned.key;
    ssl_dhparam /etc/ssl/certs/dhparam.pem; 

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}