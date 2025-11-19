# Changelog

All notable changes to the meta-log package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-19

### Added

#### Core Features
- **Prolog Engine**: Full Prolog engine with unification and SLD resolution
- **Datalog Engine**: Datalog engine with fact extraction and fixed-point computation
- **R5RS Integration**: R5RS Scheme integration via Geiser
- **M-Expression Support**: Human-readable M-expression parser and evaluator
- **Natural Language Interface**: Ask questions in plain English
- **Org Mode Integration**: Use Org Mode files as automaton blackboards
- **Library of Babel**: Execute meta-log code blocks in Org Mode
- **Automaton Loader**: Load automata from CanvasL files

#### Optional Modules
- **Federation**: Peer-to-peer federation and synchronization
- **Cryptography**: BIP32/39/44 cryptographic key derivation
- **MQTT**: MQTT pub/sub messaging for distributed systems
- **WebRTC**: WebRTC peer connections with TCP fallback
- **Identity Management**: Peer identity management system
- **Protocol Handlers**: CanvasL protocol handlers
- **Server Coordination**: Emacs server coordination layer
- **Collective Intelligence**: Collective intelligence features
- **Verifiable Computation**: Verifiable computation support
- **WordNet Integration**: WordNet semantic analysis
- **Template Discovery**: Dynamic template discovery system
- **Template Federation**: Federated template sharing
- **Canvas API**: Web Canvas API integration
- **Geometric Consensus**: Geometric consensus foundation

#### Documentation
- Comprehensive README.md with installation and usage instructions
- User Guide (docs/USER_GUIDE.md)
- API Reference (docs/API_REFERENCE.md)
- Examples in Org Mode format (docs/EXAMPLES.org)
- Federation Guide (docs/FEDERATION_GUIDE.md)
- Cryptography Guide (docs/CRYPTO_GUIDE.md)
- Protocol Handlers documentation (docs/PROTOCOL_HANDLERS.md)
- Template Discovery documentation (docs/TEMPLATE-DISCOVERY-BRIDGE.md)
- Development documentation in dev-docs/

#### Infrastructure
- Docker support for containerized deployment
- MELPA-ready package structure
- Comprehensive test suite
- .gitignore and .elpaignore for proper packaging
- Modular architecture with core + optional modules

### Changed
- Reorganized package structure for MELPA compatibility
- Separated core modules from optional modules for reduced dependencies
- Lowered Emacs version requirement from 29.1 to 28.1 for broader compatibility
- Moved development documentation to dev-docs/ directory
- Moved tests to tests/ directory
- Moved Docker files to docker/ directory

### Technical Details
- **License**: MIT License
- **Emacs Version**: Requires Emacs 28.1 or later
- **Dependencies**: org (9.6+), geiser (0.18+), dash (2.19+)
- **Optional External Dependencies**: Guile 3.0+ (for R5RS), Mosquitto (for MQTT), npm (for automaton-evolutions)
- **Lines of Code**: ~5,600 lines across 26 Elisp files
- **Package Size**: ~548KB

### Architecture
- **Core Philosophy**: User-friendly abstraction layer for automaton systems
- **Design Pattern**: Modular architecture with optional feature loading
- **Integration**: Deep integration with Emacs ecosystem (Org Mode, Geiser, dash.el)

---

[1.0.0]: https://github.com/bthornemail/meta-log/releases/tag/v1.0.0
