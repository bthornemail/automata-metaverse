// import { connect } from "mqtt";
import mqtt from "./modules/mqtt/mqtt.esm.js"; // import connect from mqtt
import * as ethers from "./modules/ethers/ethers.min.js";
import * as Merkletree from './modules/merkletree/merkletree.js';
import base64url from 'https://cdn.jsdelivr.net/npm/base64url@3.0.1/+esm'
// Import MQTT (browser-compatible ESM version)
// import mqtt from "https://unpkg.com/mqtt@4.3.7/dist/mqtt.min.js";

// Initialize MQTT client
const client = mqtt.connect("ws://localhost:3883"); // Replace with your broker URL

// Initialize HD wallets
const _host = ethers.HDNodeWallet.createRandom("", "m/0");
const _user = ethers.HDNodeWallet.fromPhrase("roast thank tiny coach seat ensure cruel auto shaft finish fee resemble");
const host = _host.neuter();
const user = _user.neuter();

// Initialize DOM elements
document.querySelector("#key").value = "";
document.querySelector("#host-url").value = "ws://localhost:33333";
document.querySelector("#host-address").value = host.extendedKey;

// Initialize graph and Merkle tree
let credentialOptions;
let credential;
const tree = new MerkleTree([user.address]);
const graph = new ForceGraph3D(document.getElementById('graph'))
	.graphData({
		nodes: [Object.assign({ color: "yellow" }, { extendedKey: user.extendedKey })],
		links: []
	})
	.width(480)
	.height(480)
	.nodeLabel("extendedKey")
	.nodeId("extendedKey")
	.onNodeClick((node) => {
		document.querySelector("#key").value = node.extendedKey;
		console.log(node);
	})
	.cooldownTicks(100);

graph.onEngineStop(() => graph.zoomToFit(400));

// Add host node to graph
document.querySelector("#connect").addEventListener("click", () => {
	const graphData = graph.graphData();
	if (graphData.nodes.find((node) => node.extendedKey === host.extendedKey)) return;

	graph.graphData({
		nodes: [
			Object.assign({ color: "red", protocol: "ws", host: "127.0.0.1", port: 33333 }, { extendedKey: host.extendedKey }, host),
			...graphData.nodes
		],
		links: [
			{ source: user.extendedKey, target: host.extendedKey },
			...graphData.links
		]
	});
});

// Create new wallet/node
document.querySelector("#create").addEventListener("click", () => {
	const graphData = graph.graphData();
	const newWallet = user.deriveChild(graphData.nodes.length);
	const extendedKey = newWallet.extendedKey;
	const address = newWallet.address;
	const leaf = tree.bufferify(extendedKey);
	const hash = leaf.toString("hex");
	const signature = _user.signMessageSync(hash);
	const w = _user.signingKey;
	const x = _host.publicKey;
	const y = w.computeSharedSecret(x);
	const z = ethers.id(y);

	// Add new node to graph
	graph.graphData({
		nodes: [
			Object.assign({ color: "white" }, { extendedKey }, {
				credentialOptions: {
					challenge: new TextEncoder().encode(z),
					rp: { id: "localhost", name: extendedKey },
					user: {
						id: new TextEncoder().encode(address),
						name: extendedKey,
						displayName: address
					},
					pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -8 }, { type: "public-key", alg: -257 }],
					authenticatorSelection: {
						authenticatorAttachment: "cross-platform",
						requireResidentKey: true,
						residentKey: "required",
					},
					attestation: "none"
				}
			}),
			...graphData.nodes
		],
		links: [
			{ source: user.extendedKey, target: newWallet.extendedKey },
			...graphData.links
		]
	});
});

// Register with WebAuthn
document.querySelector("#register").addEventListener("click", async () => {
	try {
		const extendedKey = document.querySelector("#key").value;
		const targetNode = graph.graphData().nodes.find(n => n.extendedKey === extendedKey);

		// Validate target node
		if (!targetNode) {
			throw new Error("Target node not found. Please enter a valid extended key.");
		}

		// Get challenge from target node
		const challengeResponse = await client.publish(
			`${targetNode.host}/challenge`,
			JSON.stringify({
				extendedKey: user.extendedKey,
				merkleRoot: tree.getRoot().toString('hex')
			})
		);

		// Ensure challenge is defined
		const challenge = challengeResponse.challenge;
		if (!challenge) {
			throw new Error("Challenge is undefined. Please check the server response.");
		}

		// Create WebAuthn credential
		const credential = await navigator.credentials.create({
			publicKey: {
				challenge: base64url.toBuffer(challenge),
				rp: { id: targetNode.host, name: targetNode.extendedKey },
				user: {
					id: new TextEncoder().encode(user.address),
					name: user.extendedKey,
					displayName: user.address
				},
				pubKeyCredParams: [{ type: "public-key", alg: -7 }]
			}
		});

		// Ensure credential and rawId are defined
		if (!credential || !credential.rawId) {
			throw new Error("Credential or rawId is undefined. WebAuthn registration failed.");
		}

		// Prepare attestation package
		const merkleProof = tree.getProof(extendedKey);
		const attestationPackage = {
			type: 'webauthn_attestation',
			credential,
			merkleProof,
			challenge: challenge,
			signature: _user.signMessageSync(challenge)
		};

		// Update local graph
		graph.graphData({
			nodes: graph.graphData().nodes.map(n =>
				n.extendedKey === extendedKey ?
					{ ...n, attestation: attestationPackage } :
					n
			)
		});

		// Sync with remote graph
		await client.publish(
			`${targetNode.host}/attestation`,
			JSON.stringify(attestationPackage) // Convert object to string
		);

	} catch (err) {
		console.error('Graph-based registration failed:', err);
		alert(err.message); // Show error to the user
	}
});

// Activate WebAuthn assertion
document.querySelector("#activate").addEventListener("click", async () => {
	try {
		const extendedKey = document.querySelector("#key").value;
		const targetNode = graph.graphData().nodes.find(n => n.extendedKey === extendedKey);

		// Validate target node
		if (!targetNode) {
			throw new Error("Target node not found. Please enter a valid extended key.");
		}

		// Get assertion challenge
		const challengeResponse = await client.publish(
			`${targetNode.host}/assertion`,
			JSON.stringify({
				extendedKey: user.extendedKey,
				merkleRoot: tree.getRoot().toString('hex')
			})
		);

		// Ensure challenge is defined
		const challenge = challengeResponse.challenge;
		if (!challenge) {
			throw new Error("Challenge is undefined. Please check the server response.");
		}

		// Generate WebAuthn assertion
		const assertion = await navigator.credentials.get({
			publicKey: {
				challenge: base64url.toBuffer(challenge),
				rpId: targetNode.host,
				allowCredentials: [{
					type: "public-key",
					id: base64url.toBuffer(targetNode.attestation.credential.rawId),
					transports: ["internal"]
				}]
			}
		});

		// Prepare assertion package
		const assertionPackage = {
			type: 'webauthn_assertion',
			assertion,
			merklePath: graph.findPath(user.extendedKey, extendedKey),
			challenge: challenge,
			signature: _user.signMessageSync(challenge)
		};

		// Update graph state
		graph.graphData({
			nodes: graph.graphData().nodes.map(n =>
				n.extendedKey === extendedKey ?
					{ ...n, assertion: assertionPackage } :
					n
			)
		});

		// Transmit through graph protocol
		await client.publish(
			`${targetNode.host}/verify`,
			JSON.stringify(assertionPackage) // Convert object to string
		);

	} catch (err) {
		console.error('Graph-based activation failed:', err);
		alert(err.message); // Show error to the user
	}
});

// Handle incoming MQTT messages
client.on("message", (topic, message) => {
	const data = JSON.parse(message.toString());
	switch (topic) {
		case "webauthn/challenge":
			handleChallenge(data);
			break;
		case "webauthn/attestation":
			handleAttestation(data);
			break;
		case "webauthn/assertion":
			handleAssertion(data);
			break;
	}
});

// Validation utilities
function validateAttestation(credential, merkleProof, publicKey) {
	return ethers.verifyMessage(
		credential.response.clientDataJSON,
		merkleProof
	) === publicKey;
}

function verifyAssertion(assertion, attestation, merklePath) {
	return merklePath.every(node =>
		node.attestationStatus === 'verified' &&
		tree.verify(node.merkleProof, assertion.signature)
	);
}
// Conflict-free replicated data type (CRDT) pattern
function mergeGraphs(local, remote) {
	return new MultiGraph().import({
		nodes: _.unionBy(local.nodes, remote.nodes, 'extendedKey'),
		links: _.unionBy(local.links, remote.links, 'source,target')
	});
}
// Signed edge creation
function createEdge(source, target) {
	const edgeHash = ethers.sha256(ethers.toUtf8Bytes(`${source}-${target}`));
	const signature = _user.signMessageSync(edgeHash);
	return { source, target, signature };
}
// Periodic graph synchronization
setInterval(() => {
	graph.graphData().nodes.forEach(node => {
		client.publish(`${"node.protocol.host"}:${"node.protocol.port"}/sync`, {
			// client.publish(`${node.protocol.host}:${node.protocol.port}/sync`, {
			merkleRoot: tree.getRoot().toString('hex'),
			nodes: graph.graphData().nodes,
			links: graph.graphData().links
		});
	});
}, 5000);
// Periodic node validation
setInterval(async () => {
	const challenge = randomBytes(16);
	await client.publish(`nodes/${nodeId}/challenge`, challenge);
	// Expect signed response within timeframe
}, 30000);
// Node creation using HD derivation <source_id data="auth.js" />
const newWallet = user.deriveChild(graphData.nodes.length);
graph.graphData({
	nodes: [{
		extendedKey: newWallet.extendedKey,
		credentialOptions: { /* WebAuthn config */ }
	}]
});
// Challenge generation [server]
const challenge = randomBytes(32);
challenges.set(challenge.toString('hex'), challenge);
ws.send(JSON.stringify({ type: 'webauthn-options', options }));

// Client-side attestation [browser]
const credential = await navigator.credentials.create({
	publicKey: {
		challenge: base64url.toBuffer(challenge),
		rp: { id: targetNode.host },
		user: { id: new TextEncoder().encode(address) }
	}
});
// MQTT broadcast [server]
function broadcastGraphUpdate(update: any) {
	mqttClient.publish('graph/updates', JSON.stringify(update));
	sseClients.forEach(client => client.write(`data: ${update}\n\n`));
}

// Client-side sync [browser]
setInterval(() => {
	client.publish(`${node.host}/sync`, {
		merkleRoot: tree.getRoot().toString('hex'),
		nodes: graph.graphData().nodes
	});
}, 5000);
// Proof generation [browser]
const merkleProof = tree.getProof(extendedKey);
const isValid = tree.verify(merkleProof, extendedKey, root);

// Server-side validation [auth.js pattern]
function verifyAssertion(assertion, attestation) {
	return merklePath.every(node =>
		node.attestationStatus === 'verified' &&
		tree.verify(node.merkleProof, assertion.signature)
	);
}
function onConnect() {
	const graphData = graph.graphData();
	if (graphData.nodes.find((node) => node.extendedKey === host.extendedKey)) return;

	// Create signed edge
	const edge = createEdge(user.extendedKey, host.extendedKey);

	graph.graphData({
		nodes: [
			Object.assign({ color: "red", protocol: "ws", host: "127.0.0.1", port: 33333 },
				{ extendedKey: host.extendedKey }, host),
			...graphData.nodes
		],
		links: [edge, ...graphData.links]
	});
}