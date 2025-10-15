// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Food Supply Chain Tracking
 * @notice Tracks produce lifecycle: Harvest -> Shipment -> Receiving
 * @dev Simple owner-managed roles; strict state transitions; emits events for off-chain indexing
 */
contract SupplyChain {
    enum ProductState {
        Created,
        Shipped,
        Received
    }

    struct Product {
        uint256 id;
        string name;
        string originFarm;
        string metadataCid; // IPFS/Web3.Storage CID for off-chain metadata (images, certificates)
        address farmer;
        address shipper;
        address receiver;
        address currentOwner;
        ProductState state;
        uint256 createdAt;
        uint256 shippedAt;
        uint256 receivedAt;
        bool exists;
    }

    address public immutable contractOwner;

    mapping(address => bool) public isFarmer;
    mapping(address => bool) public isShipper;
    mapping(address => bool) public isReceiver;

    mapping(uint256 => Product) private idToProduct;

    event RoleUpdated(address indexed account, string role, bool enabled);
    event ProductCreated(uint256 indexed productId, string name, string originFarm, address indexed farmer);
    event ProductShipped(uint256 indexed productId, address indexed shipper);
    event ProductReceived(uint256 indexed productId, address indexed receiver);
    event ProductMetadataUpdated(uint256 indexed productId, string metadataCid, address indexed updater);

    modifier onlyOwner() {
        require(msg.sender == contractOwner, 'Not contract owner');
        _;
    }

    modifier onlyFarmer() {
        require(isFarmer[msg.sender], 'Not authorized: farmer');
        _;
    }

    modifier onlyShipper() {
        require(isShipper[msg.sender], 'Not authorized: shipper');
        _;
    }

    modifier onlyReceiver() {
        require(isReceiver[msg.sender], 'Not authorized: receiver');
        _;
    }

    constructor() {
        contractOwner = msg.sender;
        // bootstrap: owner is all roles for convenience in local dev
        isFarmer[msg.sender] = true;
        isShipper[msg.sender] = true;
        isReceiver[msg.sender] = true;
    }

    // -------- Role Management (Owner only) --------
    function setFarmer(address account, bool enabled) external onlyOwner {
        require(account != address(0), 'Zero address');
        isFarmer[account] = enabled;
        emit RoleUpdated(account, 'FARMER', enabled);
    }

    function setShipper(address account, bool enabled) external onlyOwner {
        require(account != address(0), 'Zero address');
        isShipper[account] = enabled;
        emit RoleUpdated(account, 'SHIPPER', enabled);
    }

    function setReceiver(address account, bool enabled) external onlyOwner {
        require(account != address(0), 'Zero address');
        isReceiver[account] = enabled;
        emit RoleUpdated(account, 'RECEIVER', enabled);
    }

    // -------- Core Product Lifecycle --------
    function createProduct(
        uint256 productId,
        string calldata name,
        string calldata originFarm
    ) external onlyFarmer {
        require(productId != 0, 'Invalid productId');
        require(!idToProduct[productId].exists, 'Product already exists');
        require(bytes(name).length > 0, 'Empty name');
        require(bytes(originFarm).length > 0, 'Empty origin');

        Product storage p = idToProduct[productId];
        p.id = productId;
        p.name = name;
        p.originFarm = originFarm;
        // metadataCid is optional and can be set later via setProductMetadataCid
        p.farmer = msg.sender;
        p.currentOwner = msg.sender;
        p.state = ProductState.Created;
        p.createdAt = block.timestamp;
        p.exists = true;

        emit ProductCreated(productId, name, originFarm, msg.sender);
    }

    function shipProduct(uint256 productId) external onlyShipper {
        Product storage p = idToProduct[productId];
        require(p.exists, 'Product does not exist');
        require(p.state == ProductState.Created, 'Not in Created state');
        // effects
        p.shipper = msg.sender;
        p.currentOwner = msg.sender;
        p.state = ProductState.Shipped;
        p.shippedAt = block.timestamp;
        emit ProductShipped(productId, msg.sender);
    }

    function receiveProduct(uint256 productId) external onlyReceiver {
        Product storage p = idToProduct[productId];
        require(p.exists, 'Product does not exist');
        require(p.state == ProductState.Shipped, 'Not in Shipped state');
        // effects
        p.receiver = msg.sender;
        p.currentOwner = msg.sender;
        p.state = ProductState.Received;
        p.receivedAt = block.timestamp;
        emit ProductReceived(productId, msg.sender);
    }

    /**
     * @notice Set or update IPFS/Web3.Storage metadata CID for a product
     * @dev Only original farmer or contract owner can set metadata.
     */
    function setProductMetadataCid(uint256 productId, string calldata cid) external {
        Product storage p = idToProduct[productId];
        require(p.exists, 'Product does not exist');
        require(msg.sender == p.farmer || msg.sender == contractOwner, 'Not authorized: metadata');
        require(bytes(cid).length > 0, 'Empty CID');
        p.metadataCid = cid;
        emit ProductMetadataUpdated(productId, cid, msg.sender);
    }

    // -------- Views --------
    function getProduct(uint256 productId)
        external
        view
        returns (
            uint256 id,
            string memory name,
            string memory originFarm,
            string memory metadataCid,
            address farmer,
            address shipper,
            address receiver,
            address currentOwner,
            ProductState state,
            uint256 createdAt,
            uint256 shippedAt,
            uint256 receivedAt
        )
    {
        Product storage p = idToProduct[productId];
        require(p.exists, 'Product does not exist');
        return (
            p.id,
            p.name,
            p.originFarm,
            p.metadataCid,
            p.farmer,
            p.shipper,
            p.receiver,
            p.currentOwner,
            p.state,
            p.createdAt,
            p.shippedAt,
            p.receivedAt
        );
    }
}
