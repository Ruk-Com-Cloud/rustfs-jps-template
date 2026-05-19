/**
 * Let's Encrypt deployHook (deployHookType: js).
 *
 * WHY THIS EXISTS: the official jelastic-jps/lets-encrypt add-on does NOT
 * generate our HTTPS vhost — it delegates :443 to `jem ssl` / the platform
 * SLB BindSSL (verified in its ssl-manager.js). So a default 443 server block
 * would NOT carry our SigV4-safe directives. This hook owns post-issue config:
 * it writes a :443 server that `include`s /etc/nginx/conf.d/s3-proxy.inc
 * (the exact same contract as :80) and reloads NGINX.
 *
 * Contract (verified from lets-encrypt ssl-manager.js + minio/scripts/deployHook.js):
 *  - Fires AFTER successful cert issuance, on install AND every ~30-day renewal
 *    (so it MUST be idempotent — it overwrites the vhost each run).
 *  - Params available via getParam(): envName, envDomain, action, customDomains, ...
 *  - `action === 'uninstall'` → remove the vhost.
 *  - Issued certs are already on the bound (bl) node at
 *    /var/lib/jelastic/keys/{fullchain,privkey}.pem.
 *  - `jelastic` API + `session` are available in the EvalCode context.
 */

var envName = getParam('envName');
var action  = getParam('action');
var domains = (getParam('customDomains') || getParam('envDomain') || '').toString();
var serverName = domains.split(/[,; ]+/).filter(Boolean).join(' ') || '_';

var SSL_CONF = '/etc/nginx/conf.d/s3-proxy-ssl.conf';
var FULLCHAIN = '/var/lib/jelastic/keys/fullchain.pem';
var PRIVKEY   = '/var/lib/jelastic/keys/privkey.pem';

var cmd;
if (action === 'uninstall') {
	cmd = "rm -f " + SSL_CONF + " && nginx -s reload || true";
} else {
	// Heredoc-write the :443 vhost; reuse the shared SigV4-safe include.
	cmd =
		"cat > " + SSL_CONF + " <<'EOF'\n" +
		"server {\n" +
		"    listen 443 ssl;\n" +
		"    server_name " + serverName + ";\n" +
		"    ssl_certificate     " + FULLCHAIN + ";\n" +
		"    ssl_certificate_key " + PRIVKEY + ";\n" +
		"    include /etc/nginx/conf.d/s3-proxy.inc;\n" +
		"}\n" +
		"EOF\n" +
		"nginx -t && nginx -s reload";
}

// Run on the bl (NGINX LB) node group — the LE-bound layer.
var resp = jelastic.env.control.ExecCmd(
	envName, session, toJSON([{ command: cmd, nodeGroup: 'bl' }]), true, 'root'
);
return resp;
