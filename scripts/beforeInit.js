/**
 * onBeforeInit — runs before the install form renders / before provisioning.
 *
 * Responsibilities (PRD F2/F3, research §Architecture):
 *  - Pin the RustFS image tag from configs/vers.yaml globals (rustfs_default_tag).
 *  - Decide install protocol (https only meaningful AFTER Phase-2 SSL bind; install
 *    always starts on http per PRD FR-3.4 two-phase flow).
 *  - Enforce cluster minimum node count for RustFS distributed (>=4) and surface the
 *    experimental warning (PRD FR-2.3 / NFR-5 / D3 risk acceptance).
 *
 * Cloud Scripting JS contract: return { result: 0 } on success; result != 0 aborts
 * with `onAfterReturn`/message. `nodes`, `settings`, `env` are available via the
 * injected context.
 *
 * [VERIFY] Exact JCS JS API for dynamic field mutation differs across platform
 * versions — validate on the target Jelastic/Virtuozzo edition before release
 * (research: dev workflow = Import>JPS + in-editor validation; no offline validator).
 */

var topology   = '${settings.topology}';
var nodeCountS = '${settings.nodeCount}';
var publicIp   = '${settings.attachPublicIp}';

var resp = { result: 0 };

// --- Cluster guard (RustFS distributed is BETA-unstable; research §RustFS caveats) ---
if (topology === 'cluster') {
	var n = parseInt(nodeCountS, 10);
	if (isNaN(n) || n < 4) {
		return {
			result: 4001,
			type: 'warning',
			message: 'RustFS cluster (distributed/erasure-coded) requires at least 4 nodes ' +
			         'and is EXPERIMENTAL — not recommended for production until RustFS 1.0 GA. ' +
			         'Choose "single" for production, or set node count to 4/8/16.'
		};
	}
}

// --- Pin image tag from vers.yaml globals (loaded via manifest `mixins`) ---
// globals.rustfs_image_repo + globals.rustfs_default_tag come from configs/vers.yaml.
// Exposed downstream as ${globals.RUSTFS_IMAGE} for the `cp` node.
resp.onAfterReturn = {
	setGlobals: {
		RUSTFS_IMAGE: '${globals.rustfs_image_repo}:${globals.rustfs_default_tag}',
		// Install always begins on http; Phase-2 (addons/bind-ssl.jps) flips to https.
		PROTOCOL: 'http',
		PUBLIC_IP_REQUESTED: (publicIp === 'true') ? 'true' : 'false'
	}
};

return resp;
