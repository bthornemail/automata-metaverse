import mqtt from "./modules/mqtt/mqtt.esm.js"; // import connect from mqtt
import * as ethers from "./modules/ethers/ethers.min.js";
// import * as MultiGraph from "./modules/graphology/graphology.min.js";
import * as Openpgp from "./modules/openpgp/openpgp.js";
// import * as qrcode from './modules/qrcode/qrcode.js'
import * as Merkletree from './modules/merkletree/merkletree.js';
// import * as THREE from './modules/three/build/three.module.js';

// import ForceGraph3D from './modules/'
import base64url from 'https://unpkg.com/base64url/dist/base64url.mjs';

const _host = ethers.HDNodeWallet.createRandom("", "m/0");
const _user = ethers.HDNodeWallet.fromPhrase("roast thank tiny coach seat ensure cruel auto shaft finish fee resemble");
const host = _host.neuter();
const user = _user.neuter();
// let socket;
document.querySelector("#key").value = ""
document.querySelector("#host-url").value = "ws://localhost:33333"
document.querySelector("#host-address").value = host.extendedKey


document.addEventListener("DOMContentLoaded", async () => {
	let credentialOptions;
	let credential;

	const tree = new MerkleTree([user.address]);
	const graph = new ForceGraph3D(document.getElementById('graph'))
		.graphData({
			nodes: [
				Object.assign({ color: "yellow" }, { extendedKey: user.extendedKey })],
			links: []
		})
		.width(480)
		.height(480)
		.nodeLabel("extendedKey")
		.nodeId("extendedKey")
		.onNodeClick((node) => {
			document.querySelector("#key").value = node.extendedKey;
			console.log(node)
		})
		.cooldownTicks(100);

	graph.onEngineStop(() => graph.zoomToFit(400));
	document.querySelector("#connect").addEventListener("click", () => {
		// creates  A wallet
		// socket = new WebSocket("ws://localhost:33333");
		// socket.onopen = async () => {
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
		})
		// };

		// socket.onmessage = async (event) => {
		// 	console.log("Received message:", event.data);
		// 	const { extendedKey, root, hash, signature, content } = JSON.parse(event.data);
		// 	// const response = await onMessage({ extendedKey, root, hash, signature, content });
		// 	if (content) {
		// 		let credential = await navigator.credentials.get(JSON.parse(content))

		// 		// let credential = await navigator.credentials.get({
		// 		// 	publicKey: {
		// 		// 		challenge: new Uint8Array([139, 66, 181, 87, 7, 203, ...]),
		// 		// 		rpId: "acme.com",
		// 		// 		allowCredentials: [{
		// 		// 			type: "public-key",
		// 		// 			id: new Uint8Array([64, 66, 25, 78, 168, 226, 174, ...])
		// 		// 		}],
		// 		// 		userVerification: "required",
		// 		// 	}
		// 		// });
		// 	} else {
		// 		// let credential = await navigator.credentials.create({
		// 		// 	publicKey: {
		// 		// 	  challenge: new Uint8Array([117, 61, 252, 231, 191, 241, ...]),
		// 		// 	  rp: { id: "acme.com", name: "ACME Corporation" },
		// 		// 	  user: {
		// 		// 		id: new Uint8Array([79, 252, 83, 72, 214, 7, 89, 26]),
		// 		// 		name: "jamiedoe",
		// 		// 		displayName: "Jamie Doe"
		// 		// 	  },
		// 		// 	  pubKeyCredParams: [ {type: "public-key", alg: -7} ]
		// 		// 	}
		// 		//   });
		// 	}

		// 	// return response ?? socket.send(response);
		// 	return;
		// };
		// socket.onerror = (error) => {
		// 	console.error("WebSocket error:", error);
		// };
	});

	document.querySelector("#create").addEventListener("click", () => {
		const graphData = graph.graphData();
		const newWallet = user.deriveChild(graphData.nodes.length);
		const extendedKey = newWallet.extendedKey;
		const address = newWallet.address;
		const leaf = tree.bufferify(extendedKey);
		const hash = leaf.toString("hex")
		const signature = _user.signMessageSync(hash);
		const w = _user.signingKey;
		const x = _host.publicKey;
		const y = w.computeSharedSecret(x);
		const z = ethers.id(y);
		// if ("PasswordCredential" in window) {
		// 	let _credential = new PasswordCredential({
		// 		id: address,
		// 		name: extendedKey, // In case of a login, the name comes from the server.
		// 		password: z//"correct horse battery staple",
		// 	});

		// 	navigator.credentials.store(_credential).then(
		// 		() => {
		// 			console.info("Credential stored in the user agent's credential manager.");
		// 		},
		// 		(err) => {
		// 			console.error("Error while storing the credential: ", err);
		// 		},
		// 	);
		// }
		graph
			.graphData({
				nodes: [
					Object.assign({ color: "white" }, { extendedKey }, {
						credentialOptions: {
							challenge: new TextEncoder().encode(z),// ?? new TextEncoder().encode("ajfbsojf"),// new Uint8Array(32),//new TextEncoder().encode(ethers.sha256(_user.signingKey.computeSharedSecret(_host.publicKey))),// new TextEncoder().encode("ajfbsojf"),
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
			})

	});

	// In auth.js (updated register handler)
	document.querySelector("#register").addEventListener("click", async () => {
		try {
			const extendedKey = document.querySelector("#key").value;
			const targetNode = graph.graphData().nodes.find(n => n.extendedKey === extendedKey);

			// Phase 1: Get challenge from target graph node
			const challengeResponse = await mqtt.publish(targetNode.host + "/challenge", {
				extendedKey: user.extendedKey,
				merkleRoot: tree.getRoot().toString('hex')
			});

			// Phase 2: Create credential with graph-based challenge
			const credential = await navigator.credentials.create({
				publicKey: {
					challenge: base64url.toBuffer(challengeResponse.challenge),
					rp: { id: targetNode.host, name: targetNode.extendedKey },
					user: {
						id: new TextEncoder().encode(user.address),
						name: user.extendedKey,
						displayName: user.address
					},
					pubKeyCredParams: [{ type: "public-key", alg: -7 }]
				}
			});

			// Phase 3: Send attestation through graph
			const merkleProof = tree.getProof(extendedKey);
			const attestationPackage = {
				type: 'webauthn_attestation',
				credential,
				merkleProof,
				challenge: challengeResponse.challenge,
				signature: _user.signMessageSync(challengeResponse.challenge)
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
			await mqtt.publish(targetNode.host + "/attestation", attestationPackage);

		} catch (err) {
			console.error('Graph-based registration failed:', err);
		}
	});

	document.querySelector("#activate").addEventListener("click", async () => {
		try {
			const extendedKey = document.querySelector("#key").value;
			const targetNode = graph.graphData().nodes.find(n => n.extendedKey === extendedKey);

			// Get assertion challenge from graph
			const challengeResponse = await mqtt.publish(targetNode.host + "/assertion", {
				extendedKey: user.extendedKey,
				merkleRoot: tree.getRoot().toString('hex')
			});

			// Generate WebAuthn assertion
			const assertion = await navigator.credentials.get({
				publicKey: {
					challenge: base64url.toBuffer(challengeResponse.challenge),
					rpId: targetNode.host,
					allowCredentials: [{
						type: "public-key",
						id: base64url.toBuffer(targetNode.attestation.credential.rawId),
						transports: ["internal"]
					}]
				}
			});

			// Verify through graph links
			const assertionPackage = {
				type: 'webauthn_assertion',
				assertion,
				merklePath: graph.findPath(user.extendedKey, extendedKey),
				challenge: challengeResponse.challenge,
				signature: _user.signMessageSync(challengeResponse.challenge)
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
			await mqtt.publish(targetNode.host + "/verify", assertionPackage);

		} catch (err) {
			console.error('Graph-based activation failed:', err);
		}
	});
});

// Add to your graph node initialization
// graph.addNode(host.extendedKey, {
// 	webAuthn: {
// 	  challenges: new Map(),
// 	  verifyChallenge: async (challenge, proof) => {
// 		// Validate Merkle proof against current root
// 		const isValid = tree.verify(proof, challenge, this.merkleRoot);
// 		if (!isValid) throw new Error("Invalid Merkle proof");
		
// 		// Store challenge with expiration
// 		this.challenges.set(challenge, {
// 		  expires: Date.now() + 300000, // 5 minutes
// 		  status: 'pending'
// 		});
// 	  }
// 	}
//   });

// // Example MQTT handler for graph updates
// mqtt.subscribe("webauthn/+", (topic, message) => {
// 	const [,,action] = topic.split('/');
// 	const node = graph.graphData().nodes.find(n => n.host === message.origin);
	
// 	switch(action) {
// 	  case 'challenge':
// 		node.webAuthn.verifyChallenge(message.challenge, message.proof);
// 		break;
// 	  case 'attestation':
// 		validateAttestation(message, node.publicKey);
// 		break;
// 	  case 'assertion':
// 		verifyAssertion(message, node.attestation);
// 		break;
// 	}
//   });