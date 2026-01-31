#!/bin/sh
set -e

# Process all .template files in conf.d with envsubst
# Only substitutes explicitly listed variables to avoid breaking nginx $variables
for template in /etc/nginx/conf.d/*.template; do
    if [ -f "$template" ]; then
        output="${template%.template}"
        echo "Processing template: $template -> $output"

        # Only substitute our custom variables, not nginx's $server_name etc.
        envsubst '${N8N_CHAT_WEBHOOK_UUID} ${N8N_CHAT_AUTH_BASE64}' < "$template" > "$output"
    fi
done

# Execute the original nginx entrypoint
exec nginx -g 'daemon off;'
