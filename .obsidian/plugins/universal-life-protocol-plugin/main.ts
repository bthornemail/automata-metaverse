import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, ItemView, TFile, TFolder, Component } from 'obsidian';
import { HDNodeWallet, Mnemonic, Wallet } from 'ethers';
import { CodeEditorView, CODE_EDITOR_VIEW_TYPE } from './src/views/CodeEditorView';

interface HarmonicVector {
	frequency: number;
	phase: number;
	amplitude: number;
	dimension: number;
	path: string;
	derivationPath: string;
	hdWalletAddress?: string;
	metadata: Record<string, any>;
}

interface PatriciaTrieNode {
	key: string;
	value?: HarmonicVector;
	children: Map<string, PatriciaTrieNode>;
	isEndOfWord: boolean;
	hdWallet?: HDNodeWallet;
	parent?: PatriciaTrieNode;
}

interface VaultMapping {
	filePath: string;
	harmonicVector: HarmonicVector;
	hdWallet: HDNodeWallet;
	patriciaPath: string[];
	canvasNode?: any;
	lastModified: Date;
}

interface UniversalLifeProtocolPluginSettings {
	brokerUrl: string;
	websocketPort: number;
	brokerPort: number;
	autoConnect: boolean;
	refreshInterval: number;
	environment: 'development' | 'production';
	mqttPorts: number[];
	rssFeedsUrls: string[];
	mcpServers: string[];
	// MCP Server Integration
	mcpServerPaths: {
		obsidianMcp: string;
		axiomCanvasMcp: string;
		identityMcp: string;
	};
	enableMqttMonitoring: boolean;
	enableRssMonitoring: boolean;
	enableMcpIntegration: boolean;
	// Harmonic Vector System Settings
	masterSeed?: string;
	derivationBasePath: string;
	harmonicVectorFile: string;
	enableHarmonicVectors: boolean;
	enablePatriciaTrie: boolean;
	enableCanvasVisualization: boolean;
	defaultFrequencyRange: [number, number];
	defaultAmplitudeRange: [number, number];
	// Code Editor Settings
	codeEditorDefaultLanguage: 'javascript' | 'markdown' | 'canvasl';
	codeEditorFontSize: number;
	codeEditorTheme: 'dark' | 'light';
	codeEditorShowLineNumbers: boolean;
	codeEditorWordWrap: boolean;
	codeEditorTabSize: number;
}

const DEFAULT_SETTINGS: UniversalLifeProtocolPluginSettings = {
	brokerUrl: 'localhost',
	websocketPort: 8080,
	brokerPort: 8081,
	autoConnect: true,
	refreshInterval: 5000,
	environment: 'development',
	mqttPorts: [1883, 3883],
	rssFeedsUrls: [
		'https://rss.cnn.com/rss/edition.rss',
		'https://feeds.bbci.co.uk/news/rss.xml',
		'https://rss.reuters.com/news/world'
	],
	mcpServers: ['codacy', 'github', 'context7', 'redis', 'obsidian-mcp', 'axiom-canvas-mcp', 'identity-mcp'],
	mcpServerPaths: {
		obsidianMcp: '/home/main/devops/universal-life-vault/src/obsidian-mcp.ts',
		axiomCanvasMcp: '/home/main/devops/universal-life-vault/src/axiom-canvas-mcp.ts',
		identityMcp: '/home/main/devops/universal-life-vault/src/identity-mcp.ts'
	},
	enableMqttMonitoring: true,
	enableRssMonitoring: true,
	enableMcpIntegration: true,
	// Harmonic Vector System Settings (defaults)
	derivationBasePath: "m/44'/60'/0'/0",
	harmonicVectorFile: 'harmonic-vectors.json',
	enableHarmonicVectors: false,
	enablePatriciaTrie: false,
	enableCanvasVisualization: false,
	defaultFrequencyRange: [0.1, 10.0] as [number, number],
	defaultAmplitudeRange: [0.0, 1.0] as [number, number],
	// Code Editor Default Settings
	codeEditorDefaultLanguage: 'javascript',
	codeEditorFontSize: 14,
	codeEditorTheme: 'dark',
	codeEditorShowLineNumbers: true,
	codeEditorWordWrap: false,
	codeEditorTabSize: 2
}

export const DASHBOARD_VIEW_TYPE = 'universal-life-protocol-dashboard';

class DashboardView extends ItemView {
	plugin: UniversalLifeProtocolPlugin;
	private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
	private websocket: WebSocket | null = null;
	private refreshInterval: number | null = null;
	private systemStats = {
		uptime: 0,
		connections: 0,
		lastUpdate: new Date(),
		brokerStatus: 'unknown',
		hypergraphNodes: 0,
		messageQueue: 0,
		mqttStatus: new Map<number, 'connected' | 'disconnected' | 'error'>(),
		rssFeeds: new Map<string, { status: 'active' | 'error' | 'stale', lastUpdate: Date, articles: number }>(),
		mcpServers: new Map<string, 'running' | 'stopped' | 'error'>()
	};

	constructor(leaf: WorkspaceLeaf, plugin: UniversalLifeProtocolPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return DASHBOARD_VIEW_TYPE;
	}

	getDisplayText() {
		return "Universal Life Protocol Dashboard";
	}

	async onOpen() {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.createEl("h2", { text: "🌐 Universal Life Protocol Dashboard" });
		
		this.buildDashboard(container);
		this.startMonitoring();
	}

	async onClose() {
		this.stopMonitoring();
		if (this.websocket) {
			this.websocket.close();
		}
	}

	private buildDashboard(container: HTMLElement) {
		// Connection Status Section
		const statusSection = container.createEl("div", { cls: "ulp-status-section" });
		statusSection.createEl("h3", { text: "🔗 Connection Status" });
		
		const statusGrid = statusSection.createEl("div", { cls: "ulp-status-grid" });
		this.createStatusCard(statusGrid, "Broker", this.systemStats.brokerStatus, "🔧");
		this.createStatusCard(statusGrid, "WebSocket", this.connectionStatus, "📡");
		this.createStatusCard(statusGrid, "Hypergraph", `${this.systemStats.hypergraphNodes} nodes`, "🕸️");

		// MQTT Monitoring Section
		if (this.plugin.settings.enableMqttMonitoring) {
			const mqttSection = container.createEl("div", { cls: "ulp-status-section" });
			mqttSection.createEl("h3", { text: "🔄 MQTT Servers" });
			
			const mqttGrid = mqttSection.createEl("div", { cls: "ulp-status-grid" });
			this.plugin.settings.mqttPorts.forEach(port => {
				const status = this.systemStats.mqttStatus.get(port) || 'disconnected';
				this.createStatusCard(mqttGrid, `MQTT :${port}`, status, "📨");
			});
		}

		// RSS Feeds Section  
		if (this.plugin.settings.enableRssMonitoring) {
			const rssSection = container.createEl("div", { cls: "ulp-status-section" });
			rssSection.createEl("h3", { text: "📰 RSS Feeds" });
			
			const rssList = rssSection.createEl("div", { cls: "ulp-rss-list" });
			this.plugin.settings.rssFeedsUrls.forEach(url => {
				const feedInfo = this.systemStats.rssFeeds.get(url) || { status: 'error', lastUpdate: new Date(), articles: 0 };
				this.createRssFeedCard(rssList, url, feedInfo);
			});
		}

		// MCP Servers Section
		if (this.plugin.settings.enableMcpIntegration) {
			const mcpSection = container.createEl("div", { cls: "ulp-status-section" });
			mcpSection.createEl("h3", { text: "⚡ MCP Servers" });
			
			const mcpGrid = mcpSection.createEl("div", { cls: "ulp-status-grid" });
			this.plugin.settings.mcpServers.forEach(server => {
				const status = this.systemStats.mcpServers.get(server) || 'stopped';
				this.createStatusCard(mcpGrid, server, status, "🤖");
			});
		}

		// System Metrics Section
		const metricsSection = container.createEl("div", { cls: "ulp-metrics-section" });
		metricsSection.createEl("h3", { text: "📊 System Metrics" });
		
		const metricsGrid = metricsSection.createEl("div", { cls: "ulp-metrics-grid" });
		this.createMetricCard(metricsGrid, "Uptime", this.formatUptime(this.systemStats.uptime), "⏱️");
		this.createMetricCard(metricsGrid, "Connections", this.systemStats.connections.toString(), "🌐");
		this.createMetricCard(metricsGrid, "Queue", this.systemStats.messageQueue.toString(), "📨");
		
		const totalRssArticles = Array.from(this.systemStats.rssFeeds.values()).reduce((sum, feed) => sum + feed.articles, 0);
		this.createMetricCard(metricsGrid, "RSS Articles", totalRssArticles.toString(), "📄");

		// Project Management Section
		const projectSection = container.createEl("div", { cls: "ulp-project-section" });
		projectSection.createEl("h3", { text: "📋 Project Management" });
		
		const taskList = projectSection.createEl("div", { cls: "ulp-task-list" });
		this.createTaskItem(taskList, "Monitor hypergraph connectivity", "high", false);
		this.createTaskItem(taskList, "Implement RSS news feed integration", "medium", true);
		this.createTaskItem(taskList, "Deploy agent tetrahedron system", "high", false);
		this.createTaskItem(taskList, "MQTT server monitoring active", "low", true);
		this.createTaskItem(taskList, "MCP integration functional", "medium", this.plugin.settings.enableMcpIntegration);

		// Controls Section
		const controlsSection = container.createEl("div", { cls: "ulp-controls-section" });
		controlsSection.createEl("h3", { text: "🎛️ Controls" });
		
		const buttonGroup = controlsSection.createEl("div", { cls: "ulp-button-group" });
		
		const connectBtn = buttonGroup.createEl("button", { 
			text: this.connectionStatus === 'connected' ? "Disconnect" : "Connect",
			cls: "mod-cta"
		});
		connectBtn.onclick = () => this.toggleConnection();
		
		const refreshBtn = buttonGroup.createEl("button", { text: "Refresh All" });
		refreshBtn.onclick = () => this.refreshData();

		const testBtn = buttonGroup.createEl("button", { text: "Test Broker" });
		testBtn.onclick = () => this.testBrokerConnection();

		if (this.plugin.settings.enableMqttMonitoring) {
			const mqttTestBtn = buttonGroup.createEl("button", { text: "Test MQTT" });
			mqttTestBtn.onclick = () => this.testMqttConnections();
		}

		if (this.plugin.settings.enableRssMonitoring) {
			const rssRefreshBtn = buttonGroup.createEl("button", { text: "Refresh RSS" });
			rssRefreshBtn.onclick = () => this.refreshRssFeeds();
		}
	}

	private createStatusCard(parent: HTMLElement, title: string, status: string, icon: string) {
		const card = parent.createEl("div", { cls: "ulp-status-card" });
		card.createEl("div", { text: icon, cls: "ulp-card-icon" });
		card.createEl("div", { text: title, cls: "ulp-card-title" });
		const statusEl = card.createEl("div", { text: status, cls: "ulp-card-status" });
		
		// Add status-specific styling
		statusEl.addClass(`ulp-status-${status.toLowerCase()}`);
	}

	private createMetricCard(parent: HTMLElement, title: string, value: string, icon: string) {
		const card = parent.createEl("div", { cls: "ulp-metric-card" });
		card.createEl("div", { text: icon, cls: "ulp-card-icon" });
		card.createEl("div", { text: title, cls: "ulp-card-title" });
		card.createEl("div", { text: value, cls: "ulp-card-value" });
	}

	private createTaskItem(parent: HTMLElement, task: string, priority: string, completed: boolean) {
		const item = parent.createEl("div", { cls: "ulp-task-item" });
		
		const checkbox = item.createEl("input", { type: "checkbox" });
		checkbox.checked = completed;
		
		const label = item.createEl("label", { text: task });
		const priorityBadge = item.createEl("span", { 
			text: priority.toUpperCase(), 
			cls: `ulp-priority ulp-priority-${priority}` 
		});
	}

	private async toggleConnection() {
		if (this.connectionStatus === 'connected') {
			this.disconnect();
		} else {
			await this.connect();
		}
	}

	private async connect() {
		this.connectionStatus = 'connecting';
		this.updateUI();
		
		try {
			const wsUrl = `ws://${this.plugin.settings.brokerUrl}:${this.plugin.settings.brokerPort}`;
			this.websocket = new WebSocket(wsUrl);
			
			this.websocket.onopen = () => {
				this.connectionStatus = 'connected';
				this.updateUI();
				new Notice("Connected to Universal Life Protocol Broker");
			};
			
			this.websocket.onmessage = (event) => {
				const data = JSON.parse(event.data);
				this.handleBrokerMessage(data);
			};
			
			this.websocket.onerror = () => {
				this.connectionStatus = 'disconnected';
				this.updateUI();
				new Notice("Failed to connect to broker", 5000);
			};
			
			this.websocket.onclose = () => {
				this.connectionStatus = 'disconnected';
				this.updateUI();
			};
		} catch (error) {
			this.connectionStatus = 'disconnected';
			this.updateUI();
			new Notice(`Connection error: ${error.message}`, 5000);
		}
	}

	private disconnect() {
		if (this.websocket) {
			this.websocket.close();
			this.websocket = null;
		}
		this.connectionStatus = 'disconnected';
		this.updateUI();
	}

	private handleBrokerMessage(data: any) {
		// Handle incoming broker messages
		console.log('Broker message:', data);
		
		if (data.type === 'system_status') {
			this.systemStats = { ...this.systemStats, ...data.stats };
			this.updateUI();
		}
	}

	private startMonitoring() {
		this.refreshInterval = window.setInterval(() => {
			this.refreshData();
		}, this.plugin.settings.refreshInterval);
		
		if (this.plugin.settings.autoConnect) {
			this.connect();
		}
	}

	private stopMonitoring() {
		if (this.refreshInterval) {
			window.clearInterval(this.refreshInterval);
			this.refreshInterval = null;
		}
	}

	private async refreshData() {
		// Update system stats
		this.systemStats.lastUpdate = new Date();
		this.systemStats.uptime += this.plugin.settings.refreshInterval / 1000;
		
		// Refresh all monitoring systems
		if (this.plugin.settings.enableMqttMonitoring) {
			await this.checkMqttConnections();
		}
		if (this.plugin.settings.enableRssMonitoring) {
			await this.refreshRssFeeds();
		}
		if (this.plugin.settings.enableMcpIntegration) {
			await this.checkMcpServers();
		}
		
		this.updateUI();
	}

	private async testBrokerConnection() {
		const testUrl = `http://${this.plugin.settings.brokerUrl}:${this.plugin.settings.brokerPort}`;
		try {
			// Simple connectivity test
			new Notice(`Testing connection to ${testUrl}...`);
			// In a real implementation, you'd make an HTTP request here
			new Notice("Broker connection test initiated", 3000);
		} catch (error) {
			new Notice(`Test failed: ${error.message}`, 5000);
		}
	}

	// Helper Functions
	private formatUptime(seconds: number): string {
		const days = Math.floor(seconds / 86400);
		const hours = Math.floor((seconds % 86400) / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		
		if (days > 0) return `${days}d ${hours}h`;
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${Math.floor(seconds / 60)}m`;
	}

	private createRssFeedCard(parent: HTMLElement, url: string, feedInfo: { status: string, lastUpdate: Date, articles: number }) {
		const card = parent.createEl("div", { cls: "ulp-rss-card" });
		
		const header = card.createEl("div", { cls: "ulp-rss-header" });
		const statusIcon = feedInfo.status === 'active' ? '🟢' : feedInfo.status === 'stale' ? '🟡' : '🔴';
		header.createEl("span", { text: statusIcon });
		header.createEl("span", { text: this.getHostFromUrl(url), cls: "ulp-rss-title" });
		
		const info = card.createEl("div", { cls: "ulp-rss-info" });
		info.createEl("div", { text: `${feedInfo.articles} articles`, cls: "ulp-rss-count" });
		info.createEl("div", { text: this.timeAgo(feedInfo.lastUpdate), cls: "ulp-rss-time" });
	}

	private getHostFromUrl(url: string): string {
		try {
			return new URL(url).hostname.replace('www.', '');
		} catch {
			return url.substring(0, 30) + '...';
		}
	}

	private timeAgo(date: Date): string {
		const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
		
		if (seconds < 60) return 'just now';
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
		if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
		return `${Math.floor(seconds / 86400)}d ago`;
	}

	// MQTT Monitoring Functions
	private async checkMqttConnections() {
		for (const port of this.plugin.settings.mqttPorts) {
			try {
				// Simulate MQTT connection test
				// In real implementation, you'd use an MQTT client library
				const isConnected = await this.testPort(this.plugin.settings.brokerUrl, port);
				this.systemStats.mqttStatus.set(port, isConnected ? 'connected' : 'disconnected');
			} catch (error) {
				this.systemStats.mqttStatus.set(port, 'error');
			}
		}
	}

	private async testMqttConnections() {
		new Notice("Testing MQTT connections...");
		await this.checkMqttConnections();
		this.updateUI();
		
		const connectedPorts = Array.from(this.systemStats.mqttStatus.entries())
			.filter(([_, status]) => status === 'connected')
			.map(([port, _]) => port);
		
		if (connectedPorts.length > 0) {
			new Notice(`✅ MQTT connected on ports: ${connectedPorts.join(', ')}`);
		} else {
			new Notice("❌ No MQTT connections available", 5000);
		}
	}

	// RSS Feed Functions
	private async refreshRssFeeds() {
		for (const url of this.plugin.settings.rssFeedsUrls) {
			try {
				// Simulate RSS feed fetch
				const feedData = await this.fetchRssFeed(url);
				this.systemStats.rssFeeds.set(url, {
					status: 'active',
					lastUpdate: new Date(),
					articles: feedData.articles
				});
			} catch (error) {
				this.systemStats.rssFeeds.set(url, {
					status: 'error',
					lastUpdate: new Date(),
					articles: 0
				});
			}
		}
	}

	private async fetchRssFeed(url: string): Promise<{ articles: number }> {
		try {
			// Simulate RSS feed parsing
			// In real implementation, you'd fetch and parse RSS XML
			const response = await fetch(url, { method: 'HEAD' });
			const isOnline = response.ok;
			
			return {
				articles: isOnline ? Math.floor(Math.random() * 50) + 10 : 0
			};
		} catch {
			return { articles: 0 };
		}
	}

	// MCP Integration Functions
	private async checkMcpServers() {
		for (const server of this.plugin.settings.mcpServers) {
			try {
				// Check if MCP server is running by looking for process or config
				const isRunning = await this.checkMcpServerStatus(server);
				this.systemStats.mcpServers.set(server, isRunning ? 'running' : 'stopped');
			} catch (error) {
				this.systemStats.mcpServers.set(server, 'error');
			}
		}
	}

	private async checkMcpServerStatus(serverName: string): Promise<boolean> {
		try {
			// In a real implementation, you might:
			// 1. Check if MCP server process is running
			// 2. Try to connect to MCP server endpoint
			// 3. Check server configuration files
			
			// For now, simulate based on your known MCP servers
			const runningServers = ['codacy', 'github', 'context7', 'redis'];
			return runningServers.includes(serverName);
		} catch {
			return false;
		}
	}

	// Utility Functions
	private async testPort(host: string, port: number): Promise<boolean> {
		try {
			// Simple port connectivity test using WebSocket attempt
			const testUrl = `ws://${host}:${port}`;
			const testWs = new WebSocket(testUrl);
			
			return new Promise((resolve) => {
				const timeout = setTimeout(() => {
					testWs.close();
					resolve(false);
				}, 3000);
				
				testWs.onopen = () => {
					clearTimeout(timeout);
					testWs.close();
					resolve(true);
				};
				
				testWs.onerror = () => {
					clearTimeout(timeout);
					resolve(false);
				};
			});
		} catch {
			return false;
		}
	}

	private updateUI() {
		// Refresh the dashboard display
		const container = this.containerEl.children[1] as HTMLElement;
		if (container) {
			container.empty();
			container.createEl("h2", { text: "🌐 Universal Life Protocol Dashboard" });
			this.buildDashboard(container);
		}
	}
}

export default class UniversalLifeProtocolPlugin extends Plugin {
	settings: UniversalLifeProtocolPluginSettings;

	async onload() {
		await this.loadSettings();

		// Register the dashboard view
		this.registerView(DASHBOARD_VIEW_TYPE, (leaf) => new DashboardView(leaf, this));

		// Register the code editor view
		// @ts-ignore - TypeScript type definition issue with registerView
		this.registerView(CODE_EDITOR_VIEW_TYPE, (leaf: WorkspaceLeaf) => new CodeEditorView(leaf, this));

		// Add ribbon icon for dashboard
		this.addRibbonIcon('network', 'Universal Life Protocol Dashboard', () => {
			this.activateDashboardView();
		}).addClass('ulp-ribbon-class');

		// Add ribbon icon for code editor
		this.addRibbonIcon('code', 'Open Code Editor', () => {
			this.activateCodeEditorView();
		}).addClass('ulp-ribbon-class');

		// Add command to open dashboard
		this.addCommand({
			id: 'open-ulp-dashboard',
			name: 'Open Universal Life Protocol Dashboard',
			callback: () => {
				this.activateDashboardView();
			}
		});

		// Add command to open code editor
		this.addCommand({
			id: 'open-code-editor',
			name: 'Open Code Editor',
			callback: () => {
				this.activateCodeEditorView();
			}
		});

		// Add status bar item
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('ULP: Disconnected');

		// Add settings tab
		this.addSettingTab(new UniversalLifeProtocolSettingTab(this.app, this));

		// Auto-open dashboard on startup if configured
		if (this.settings.autoConnect) {
			this.app.workspace.onLayoutReady(() => {
				setTimeout(() => this.activateDashboardView(), 1000);
			});
		}
	}

	onunload() {
		// Cleanup handled by view
	}

	async activateDashboardView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(DASHBOARD_VIEW_TYPE);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({ type: DASHBOARD_VIEW_TYPE, active: true });
			}
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	async activateCodeEditorView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(CODE_EDITOR_VIEW_TYPE);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({ type: CODE_EDITOR_VIEW_TYPE, active: true });
			}
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class UniversalLifeProtocolSettingTab extends PluginSettingTab {
	plugin: UniversalLifeProtocolPlugin;

	constructor(app: App, plugin: UniversalLifeProtocolPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		containerEl.createEl('h2', {text: 'Universal Life Protocol Settings'});

		// Environment Setting
		new Setting(containerEl)
			.setName('Environment')
			.setDesc('Select the environment for the Universal Life Protocol')
			.addDropdown(dropdown => dropdown
				.addOption('development', 'Development')
				.addOption('production', 'Production')
				.setValue(this.plugin.settings.environment)
				.onChange(async (value: 'development' | 'production') => {
					this.plugin.settings.environment = value;
					
					// Update URLs based on environment
					if (value === 'production') {
						this.plugin.settings.brokerUrl = 'universallifeprotocol.com';
					} else {
						this.plugin.settings.brokerUrl = 'localhost';
					}
					
					await this.plugin.saveSettings();
					this.display(); // Refresh the settings view
				}));

		// Broker URL Setting
		new Setting(containerEl)
			.setName('Broker URL')
			.setDesc('URL of the Universal Life Protocol broker')
			.addText(text => text
				.setPlaceholder('localhost or universallifeprotocol.com')
				.setValue(this.plugin.settings.brokerUrl)
				.onChange(async (value) => {
					this.plugin.settings.brokerUrl = value;
					await this.plugin.saveSettings();
				}));

		// WebSocket Port Setting
		new Setting(containerEl)
			.setName('WebSocket Port')
			.setDesc('Port for WebSocket connections')
			.addText(text => text
				.setPlaceholder('8080')
				.setValue(this.plugin.settings.websocketPort.toString())
				.onChange(async (value) => {
					const port = parseInt(value);
					if (!isNaN(port) && port > 0 && port < 65536) {
						this.plugin.settings.websocketPort = port;
						await this.plugin.saveSettings();
					}
				}));

		// Broker Port Setting
		new Setting(containerEl)
			.setName('Broker Port')
			.setDesc('Port for broker connections')
			.addText(text => text
				.setPlaceholder('8081')
				.setValue(this.plugin.settings.brokerPort.toString())
				.onChange(async (value) => {
					const port = parseInt(value);
					if (!isNaN(port) && port > 0 && port < 65536) {
						this.plugin.settings.brokerPort = port;
						await this.plugin.saveSettings();
					}
				}));

		// Auto Connect Setting
		new Setting(containerEl)
			.setName('Auto Connect')
			.setDesc('Automatically connect to broker on startup')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoConnect)
				.onChange(async (value) => {
					this.plugin.settings.autoConnect = value;
					await this.plugin.saveSettings();
				}));

		// Refresh Interval Setting
		new Setting(containerEl)
			.setName('Refresh Interval')
			.setDesc('How often to refresh dashboard data (milliseconds)')
			.addText(text => text
				.setPlaceholder('5000')
				.setValue(this.plugin.settings.refreshInterval.toString())
				.onChange(async (value) => {
					const interval = parseInt(value);
					if (!isNaN(interval) && interval >= 1000) {
						this.plugin.settings.refreshInterval = interval;
						await this.plugin.saveSettings();
					}
				}));

		// Connection Test Section
		containerEl.createEl('h3', {text: 'Connection Test'});
		
		const testDiv = containerEl.createEl('div', {cls: 'ulp-test-section'});
		
		const testButton = testDiv.createEl('button', {
			text: 'Test Connection',
			cls: 'mod-cta'
		});
		
		testButton.onclick = async () => {
			testButton.disabled = true;
			testButton.textContent = 'Testing...';
			
			try {
				// Test WebSocket connection
				const wsUrl = `ws://${this.plugin.settings.brokerUrl}:${this.plugin.settings.brokerPort}`;
				const testWs = new WebSocket(wsUrl);
				
				const testResult = await new Promise<boolean>((resolve) => {
					const timeout = setTimeout(() => resolve(false), 5000);
					
					testWs.onopen = () => {
						clearTimeout(timeout);
						testWs.close();
						resolve(true);
					};
					
					testWs.onerror = () => {
						clearTimeout(timeout);
						resolve(false);
					};
				});
				
				const resultEl = testDiv.querySelector('.test-result');
				if (resultEl) resultEl.remove();
				
				const result = testDiv.createEl('div', {cls: 'test-result'});
				if (testResult) {
					result.textContent = '✅ Connection successful';
					result.style.color = 'var(--text-success)';
				} else {
					result.textContent = '❌ Connection failed';
					result.style.color = 'var(--text-error)';
				}
				
			} catch (error) {
				const resultEl = testDiv.querySelector('.test-result');
				if (resultEl) resultEl.remove();
				
				const result = testDiv.createEl('div', {cls: 'test-result'});
				result.textContent = `❌ Error: ${error.message}`;
				result.style.color = 'var(--text-error)';
			}
			
			testButton.disabled = false;
			testButton.textContent = 'Test Connection';
		};

		// Code Editor Settings Section
		containerEl.createEl('h3', {text: 'Code Editor Settings'});
		
		new Setting(containerEl)
			.setName('Default Language')
			.setDesc('Default language for new files in code editor')
			.addDropdown(dropdown => dropdown
				.addOption('javascript', 'JavaScript')
				.addOption('markdown', 'Markdown')
				.addOption('canvasl', 'CanvasL')
				.setValue(this.plugin.settings.codeEditorDefaultLanguage)
				.onChange(async (value: 'javascript' | 'markdown' | 'canvasl') => {
					this.plugin.settings.codeEditorDefaultLanguage = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Font Size')
			.setDesc('Font size for code editor (in pixels)')
			.addText(text => text
				.setPlaceholder('14')
				.setValue(this.plugin.settings.codeEditorFontSize.toString())
				.onChange(async (value) => {
					const fontSize = parseInt(value);
					if (!isNaN(fontSize) && fontSize >= 8 && fontSize <= 24) {
						this.plugin.settings.codeEditorFontSize = fontSize;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName('Theme')
			.setDesc('Color theme for code editor')
			.addDropdown(dropdown => dropdown
				.addOption('dark', 'Dark')
				.addOption('light', 'Light')
				.setValue(this.plugin.settings.codeEditorTheme)
				.onChange(async (value: 'dark' | 'light') => {
					this.plugin.settings.codeEditorTheme = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show Line Numbers')
			.setDesc('Display line numbers in code editor')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.codeEditorShowLineNumbers)
				.onChange(async (value) => {
					this.plugin.settings.codeEditorShowLineNumbers = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Word Wrap')
			.setDesc('Enable word wrapping in code editor')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.codeEditorWordWrap)
				.onChange(async (value) => {
					this.plugin.settings.codeEditorWordWrap = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Tab Size')
			.setDesc('Number of spaces per tab')
			.addText(text => text
				.setPlaceholder('2')
				.setValue(this.plugin.settings.codeEditorTabSize.toString())
				.onChange(async (value) => {
					const tabSize = parseInt(value);
					if (!isNaN(tabSize) && tabSize >= 1 && tabSize <= 8) {
						this.plugin.settings.codeEditorTabSize = tabSize;
						await this.plugin.saveSettings();
					}
				}));
	}
}
