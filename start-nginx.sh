#!/bin/sh
# Startup script for nginx that uses Railway's PORT environment variable

# Default to 8080 if PORT is not set
PORT=${PORT:-8080}

# Generate nginx config with PORT variable
envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g 'daemon off;'

