# Shared SigV4-safe S3 proxy directives — included by BOTH the :80 server
# (s3-proxy.conf.tpl) and the :443 server written by the Let's Encrypt
# deployHook (scripts/deployHook.js). Keeping this in ONE file is what
# guarantees HTTPS has the same SigV4-safe contract as HTTP
# (the LE add-on does NOT generate our vhost — verified from
#  jelastic-jps/lets-encrypt ssl-manager.js: it delegates 443 to jem ssl/SLB).
#
# RULE: transparent byte/header pipe, never a normalizing cache.
# __CP_HOST__ / __S3_PORT__ are substituted at install time.

client_max_body_size 0;          # NGINX 1MB default -> 413 on large/multipart
merge_slashes off;               # do not collapse // in keys (signed URI)
ignore_invalid_headers off;      # S3 uses headers NGINX may otherwise drop

# RustFS liveness (always 200 if up). GET only — older pinned tags lack HEAD
# (rustfs#935 fixed on main; beta.3+ has HEAD, but GET is safe everywhere).
location = /health {
    proxy_pass http://__CP_HOST__:__S3_PORT__;
    access_log off;
}
# Strict readiness (503 until storage+IAM ready) — used by upgrade verify.
location = /health/ready {
    proxy_pass http://__CP_HOST__:__S3_PORT__;
    access_log off;
}

location / {
    proxy_pass http://__CP_HOST__:__S3_PORT__;

    # Load-bearing: RustFS validates SigV4 against the incoming Host
    # (verified: rustfs signs against request Host; RUSTFS_SERVER_DOMAINS
    #  unset + path-style => correct as long as Host is preserved).
    proxy_set_header Host               $http_host;
    proxy_set_header X-Real-IP          $remote_addr;
    proxy_set_header X-Forwarded-For    $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto  $scheme;
    proxy_set_header X-Forwarded-Host   $http_host;

    proxy_buffering         off;     # stream large GETs
    proxy_request_buffering off;     # don't corrupt aws-chunked streaming SigV4
    proxy_http_version      1.1;
    proxy_read_timeout      300s;
    proxy_send_timeout      300s;
    proxy_connect_timeout   75s;

    chunked_transfer_encoding off;   # response side only
    proxy_redirect off;
    # Authorization + x-amz-* forwarded unmodified (NGINX default).
}
