# :80 S3 reverse proxy for RustFS. Written to /etc/nginx/conf.d/s3-proxy.conf
# by manifest `configureLB` (__CP_HOST__ / __S3_PORT__ substituted at install).
# The SigV4-safe directives live in s3-proxy.inc so the :443 server block
# (created by scripts/deployHook.js after Let's Encrypt issues the cert)
# reuses the EXACT same contract.
#
# TLS terminates at the LB (verified: LE add-on delegates 443 to jem ssl /
# platform SLB BindSSL — it does NOT write this vhost). LB->cp leg is plaintext
# over the internal network (avoid SSL passthrough: loses Host preservation).

server {
    listen 80 default_server;
    server_name _;

    # Shared SigV4-safe contract (see s3-proxy.inc).
    include /etc/nginx/conf.d/s3-proxy.inc;
}
