// import mqtt from "./modules/mqtt/mqtt.esm.js"; // import connect from mqtt
// import * as ethers from "./modules/ethers/ethers.min.js";
// // import * as MultiGraph from "./modules/graphology/graphology.min.js";
// import * as Openpgp from "./modules/openpgp/openpgp.js";
// // import * as qrcode from './modules/qrcode/qrcode.js'
// import * as Merkletree from './modules/merkletree/merkletree.js';
// import * as THREE from './modules/three/build/three.module.js';

import ForceGraph3D from "3d-force-graph";
import { HDNodeWallet, ethers } from "ethers";
import {MerkleTree} from "merkletreejs";

// import ForceGraph3D from './modules/'
const _host = HDNodeWallet.createRandom("", "m/0");
const _user = HDNodeWallet.fromPhrase("roast thank tiny coach seat ensure cruel auto shaft finish fee resemble");
const host = _host.neuter();
const user = _user.neuter();
const extendedKeyInput = document.querySelector("#key") as HTMLInputElement;
const hostInput = document.querySelector("#host-url") as HTMLInputElement;
const hostExtendedKeyInput = document.querySelector("#host-address") as HTMLInputElement;
const graphElement = document.getElementById('graph') as HTMLDivElement;
const connectButton = document.querySelector("#connect") as HTMLButtonElement;
const createButton = document.querySelector("#create") as HTMLButtonElement;
const registerButton = document.querySelector("#register") as HTMLButtonElement;
const activateButton = document.querySelector("#activate") as HTMLButtonElement;

document.addEventListener("DOMContentLoaded", async () => {
	let credentialOptions;
	let credential: any;
	const tree = new MerkleTree([user.address]);
	const graph = new ForceGraph3D(graphElement)
		.graphData({
			nodes: [
				Object.assign({ color: "yellow" }, { extendedKey: user.extendedKey })],
			links: []
		})
		.width(480)
		.height(480)
		.nodeLabel("extendedKey")
		.nodeId("extendedKey")
		.onNodeClick((node: any) => {
			extendedKeyInput.value = node.extendedKey;
			console.log(node)
		})
		.cooldownTicks(100);

	graph.onEngineStop(() => graph.zoomToFit(400));
	connectButton.addEventListener("click", () => {
		// creates  A wallet
		// socket = new WebSocket("ws://localhost:33333");
		// socket.onopen = async () => {
		const graphData = graph.graphData();
		if (graphData.nodes.find((node:any) => node.extendedKey === host.extendedKey)) return;
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

	createButton.addEventListener("click", () => {
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

	registerButton.addEventListener("click", async () => {
		const graphData = graph.graphData();
		const extendedKey = extendedKeyInput.value;
		const wallet = ethers.HDNodeWallet.fromExtendedKey(extendedKey);
		// const wallet = ethers.HDNodeWallet.createRandom();
		// const extendedKey = wallet.extendedKey;
		const address = wallet.address;
		const leaf = tree.bufferify(extendedKey);
		const hash = leaf.toString("hex")
		const signature = _user.signMessageSync(hash);
		const w = _user.signingKey;
		const x = _host.publicKey;
		const y = w.computeSharedSecret(x);
		const z = ethers.id(y);
		credential = await navigator.credentials.create({
			publicKey: {
				challenge: new TextEncoder().encode(z),// ?? new TextEncoder().encode("ajfbsojf"),// new Uint8Array(32),//new TextEncoder().encode(ethers.sha256(_user.signingKey.computeSharedSecret(_host.publicKey))),// new TextEncoder().encode("ajfbsojf"),
				rp: { id: "localhost", name: extendedKey },
				user: {
					id: new TextEncoder().encode(address),
					name: extendedKey,
					displayName: wallet.address
				},
				pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -8 }, { type: "public-key", alg: -257 }],
				// hints: ["client-device","security-key","hybrid"]
				// extensions:["usb", "nfc", "ble","internal","hybrid"],
				authenticatorSelection: {
					authenticatorAttachment: "cross-platform",
					requireResidentKey: true,
					residentKey: "required",
				},
				attestation: "none"
			}
		});
		// console.log(credential);
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
		const content = JSON.stringify({ credential });
		tree.addLeaf(leaf);
		const root = tree.getRoot().toString("utf8");
		graph
			.graphData({
				nodes: graphData.nodes.map((node: any) => {
					if (node.extendedKey === extendedKey) {
						return Object.assign(node, { color: "green" }, wallet, { root, hash, signature, content });
					}
					return node;
				}),
				links: graphData.links.map(({ source, target }: any) => {
					if (source.extendedKey === user.extendedKey && target.extendedKey === extendedKey) {
						return Object.assign({ source, target }, { source: host.extendedKey, target: extendedKey });
					};
					return { source, target };
				})
			})

		// socket.send(JSON.stringify({ extendedKey, root, hash, signature }));
	});

	activateButton.addEventListener("click", async () => {
		const graphData = graph.graphData();
		const extendedKey = extendedKeyInput.value;
		const wallet = ethers.HDNodeWallet.fromExtendedKey(extendedKey);
		const leaf = tree.bufferify(extendedKey);
		const hash = leaf.toString("hex")
		const signature = _user.signMessageSync(hash);
		// console.log(credential)
		const {
			authenticatorAttachment,
			clientExtensionResults,
			id,
			rawId,
			response,
			type
		} = credential;
		const {
			attestationObject,
			authenticatorData,
			clientDataJSON,
			// publicKey,
			// publicKeyAlgorithm,
			// transports
		} = response;
		const w = _user.signingKey;
		const x = _host.publicKey;
		const y = w.computeSharedSecret(x);
		const z = ethers.id(y)
		const assertion = await navigator.credentials.get({
			publicKey: {
				challenge: new TextEncoder().encode(z),//new TextEncoder().encode("ajfbsojf"),
				rpId: "localhost",
				allowCredentials: [{
					type: "public-key",
					transports: ["usb", "nfc", "ble", "internal", "hybrid"],
					id: rawId ?? new TextEncoder().encode("hash")
				}],
				userVerification:"required"
				// userVerification: "required",
				// authenticatorSelection: {
				// 	authenticatorAttachment: authenticatorAttachment ?? "cross-platform",
				// 	requireResidentKey: true,
				// }

			}
		});
		console.log({ assertion })
		// {
		// 	"authenticatorAttachment": "cross-platform",
		// 	"clientExtensionResults": {},
		// 	"id": "dl3evcilJIY82DvXEEk65e1Ewfwgj1wpRULotFmmAII",
		// 	"rawId": "dl3evcilJIY82DvXEEk65e1Ewfwgj1wpRULotFmmAII",
		// 	"response": {
		// 		"authenticatorData": "SZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2MFAAAAAA",
		// 		"clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiWVdwbVluTnZhbVkiLCJvcmlnaW4iOiJodHRwOi8vbG9jYWxob3N0OjQyOTQ3IiwiY3Jvc3NPcmlnaW4iOmZhbHNlfQ",
		// 		"signature": "MEUCIQCf9_WYT9MpZn300kRx2KaSZ7JSKMP4UuvqZJNTxFw0iwIgPDpt-AzpwBXmTE5spkhOcu3JEzgEUHc-UPj2ASm75CY"
		// 	},
		// 	"type": "public-key"
		// }
		// const assertion = await navigator.credentials.get(credential);
		const root = tree.getRoot().toString("hex")
		const content = JSON.stringify({ assertion });
		graph
			.graphData({
				nodes: graphData.nodes.map((node: any) => {
					if (node.extendedKey === extendedKey) {
						return Object.assign(node, { color: "blue" }, { extendedKey }, { root, hash, signature, content });
					}
					return node;
				}),
				links: graphData.links
			})

		// socket.send(JSON.stringify({ extendedKey: _user.extendedKey, root, hash, signature, content }));
	});
});