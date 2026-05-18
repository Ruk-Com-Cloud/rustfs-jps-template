/**
 * onBeforeInit — runs before provisioning.
 *  - Pin the RustFS image from configs/vers.yaml globals (rustfs_image_repo
 *    + rustfs_default_tag) -> exposed as ${globals.RUSTFS_IMAGE}.
 *  - Guard the EXPERIMENTAL cluster path (RustFS distributed is beta-unstable;
 *    needs >=4 nodes — PRD FR-2.3 / NFR-5 / D3 risk acceptance).
 *
 * Cloud Scripting JS: return { result: 0 } to continue; result != 0 aborts.
 * settings.* are available; nodeCount only exists when topology == cluster
 * (it is a showIf child of topology).
 */

var topology   = '${settings.topology}';
var nodeCountS  = '${settings.nodeCount:0}';

if (topology === 'cluster') {
	var n = parseInt(nodeCountS, 10);
	if (isNaN(n) || n < 4) {
		return {
			result: 4001,
			type: 'warning',
			message: 'RustFS cluster (distributed/erasure-coded) is EXPERIMENTAL and ' +
			         'requires at least 4 nodes. Choose "single" for production, ' +
			         'or pick a cluster size of 4/8/16.'
		};
	}
}

return {
	result: 0,
	onAfterReturn: {
		setGlobals: {
			RUSTFS_IMAGE: '${globals.rustfs_image_repo}:${globals.rustfs_default_tag}'
		}
	}
};
