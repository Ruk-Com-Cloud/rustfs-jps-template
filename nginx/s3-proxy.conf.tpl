# REFERENCE ONLY. The :80 server is now written INLINE by manifest
# `configureLB` (so server_name binds the env + custom domain instead of
# `_`/default_server, which the Jelastic nginx LB already owns and would
# otherwise make nginx ignore our server). The :443 server is written by
# scripts/deployHook.js after Let's Encrypt issues the cert. Both `include`
# /etc/nginx/conf.d/s3-proxy.inc (the shared SigV4-safe contract).
#
# Equivalent of what configureLB writes:
#
# server {
#     listen 80;
#     server_name <env-domain> <custom-domain>;
#     include /etc/nginx/conf.d/s3-proxy.inc;
# }
