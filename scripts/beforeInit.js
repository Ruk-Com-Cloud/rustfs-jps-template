/**
 * onBeforeInit — guard the EXPERIMENTAL cluster path only.
 *
 * The RustFS image is NOT set here: node topology is evaluated before
 * script-set globals exist, so routing the image through an
 * onBeforeInit global produced a literal "${globals.RUSTFS_IMAGE}:latest"
 * ("invalid reference format"). The image is resolved directly from the
 * configs/vers.yaml mixin globals in nodes.cp.image instead.
 *
 * Cloud Scripting JS: return { result: 0 } to continue; result != 0 aborts.
 * nodeCount only exists when topology == cluster (showIf child of topology).
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

return { result: 0 };
