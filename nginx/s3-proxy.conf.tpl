# SigV4-safe reverse-proxy contract for RustFS S3 (PRD NFR-3 / research §Integration).
# Written to /etc/nginx/conf.d/s3-proxy.conf by manifest `configureLB`
# (__CP_HOST__ / __S3_PORT__ substituted at install).
#
# Canonical pattern: MinIO official NGINX guide + Ceph RGW configs (research-verified).
# RULE: the proxy is a transparent byte/header pipe, NOT a normalizing cache.
# Any Host rewrite / path normalization / body re-buffering breaks SigV4 -> 403.

upstream rustfs_s3 {
    server __CP_HOST__:__S3_PORT__;
    keepalive 32;
}

server {
    listen 80;
    server_name _;

    # Large objects / multipart: NGINX default is 1 MB -> 413. Unlimited (research R2).
    client_max_body_size 0;

    # Path integrity: do NOT collapse // in keys (would alter the SigV4-signed URI).
    merge_slashes off;
    # S3 uses headers NGINX may otherwise drop.
    ignore_invalid_headers off;

    # LB health probe target (engine-specific, fixed per repo — PRD FR-8.1).
    # RustFS: GET /health on the S3 port. NOTE rustfs#935 — GET only, HEAD fails;
    # configure the platform LB health check as GET /health.
    location = /health {
        proxy_pass http://rustfs_s3;
        access_log off;
    }

    location / {
        proxy_pass http://rustfs_s3;

        # --- Load-bearing: preserve Host verbatim (SigV4 canonical request +
        #     presigned URLs). Rewriting this is the #1 cause of SignatureDoesNotMatch.
        proxy_set_header Host               $http_host;
        proxy_set_header X-Real-IP          $remote_addr;
        proxy_set_header X-Forwarded-For    $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto  $scheme;

        # Stream bodies straight through — required for large/streamed PUT and
        # aws-chunked (streaming SigV4); re-buffering corrupts per-chunk signatures.
        proxy_buffering         off;
        proxy_request_buffering off;
        proxy_http_version      1.1;

        # Large multipart / slow clients exceed the 60s default -> 504 / truncation.
        proxy_read_timeout      300s;
        proxy_send_timeout      300s;
        proxy_connect_timeout   75s;

        # Authorization + x-amz-* are forwarded unmodified (NGINX default; do NOT
        # strip/rewrite). chunked_transfer_encoding off only on the response side.
        chunked_transfer_encoding off;
        proxy_redirect off;
    }
}

# After Phase-2 SSL bind (addons/bind-ssl.jps) a TLS server{} block on 443 for the
# customer domain is added/managed by the Let's Encrypt add-on (or Custom SSL).
# TLS terminates HERE at the LB; LB->cp leg is plaintext over the internal network
# (research §Integration — avoid SSL passthrough: it loses Host preservation + L7 health).
