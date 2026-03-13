// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CredChain - Verifiable Work Credentials Registry
 * @notice On-chain registry for gig worker credential proofs
 * @dev Stores credential hashes, not full data (gas efficient)
 */
contract CredChain {
    // Credential structure
    struct Credential {
        bytes32 hash;           // Keccak256 hash of credential data
        address issuer;         // Enterprise wallet that issued it
        address worker;         // Worker wallet that received it
        uint256 issuedAt;       // Timestamp of issuance
        bool revoked;           // Can be revoked by issuer
        string platform;        // Platform name (Swiggy, Zomato, etc.)
    }

    // Mappings
    mapping(bytes32 => Credential) public credentials;  // hash => Credential
    mapping(address => bool) public verifiedIssuers;    // Issuer registry
    mapping(address => bytes32[]) public workerCredentials;  // Worker's credential hashes
    mapping(address => bytes32[]) public issuerCredentials;  // Issuer's issued credential hashes

    // Contract owner
    address public owner;

    // Events
    event CredentialIssued(
        bytes32 indexed hash,
        address indexed issuer,
        address indexed worker,
        string platform,
        uint256 timestamp
    );

    event CredentialRevoked(bytes32 indexed hash, address indexed issuer);
    event IssuerVerified(address indexed issuer);
    event IssuerRemoved(address indexed issuer);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    modifier onlyVerifiedIssuer() {
        require(verifiedIssuers[msg.sender], "Not a verified issuer");
        _;
    }

    constructor() {
        owner = msg.sender;
        // Owner is automatically a verified issuer
        verifiedIssuers[msg.sender] = true;
    }

    /**
     * @notice Add a verified issuer (only owner)
     * @param issuer Address of the enterprise to verify
     */
    function addVerifiedIssuer(address issuer) external onlyOwner {
        verifiedIssuers[issuer] = true;
        emit IssuerVerified(issuer);
    }

    /**
     * @notice Remove a verified issuer (only owner)
     * @param issuer Address of the enterprise to remove
     */
    function removeVerifiedIssuer(address issuer) external onlyOwner {
        verifiedIssuers[issuer] = false;
        emit IssuerRemoved(issuer);
    }

    /**
     * @notice Issue a credential on-chain
     * @param credentialHash Keccak256 hash of the credential JSON
     * @param worker Address of the worker receiving the credential
     * @param platform Name of the platform (e.g., "Swiggy", "Zomato")
     */
    function issueCredential(
        bytes32 credentialHash,
        address worker,
        string calldata platform
    ) external onlyVerifiedIssuer {
        require(credentials[credentialHash].issuedAt == 0, "Credential already exists");
        require(worker != address(0), "Invalid worker address");

        credentials[credentialHash] = Credential({
            hash: credentialHash,
            issuer: msg.sender,
            worker: worker,
            issuedAt: block.timestamp,
            revoked: false,
            platform: platform
        });

        workerCredentials[worker].push(credentialHash);
        issuerCredentials[msg.sender].push(credentialHash);

        emit CredentialIssued(credentialHash, msg.sender, worker, platform, block.timestamp);
    }

    /**
     * @notice Verify a credential exists and is valid
     * @param credentialHash Hash to verify
     * @return valid Whether the credential is valid (exists and not revoked)
     * @return issuer Address of the issuer
     * @return worker Address of the worker
     * @return issuedAt Timestamp of issuance
     * @return platform Platform name
     */
    function verifyCredential(bytes32 credentialHash)
        external
        view
        returns (
            bool valid,
            address issuer,
            address worker,
            uint256 issuedAt,
            string memory platform
        )
    {
        Credential memory cred = credentials[credentialHash];

        if (cred.issuedAt == 0) {
            return (false, address(0), address(0), 0, "");
        }

        return (
            !cred.revoked,
            cred.issuer,
            cred.worker,
            cred.issuedAt,
            cred.platform
        );
    }

    /**
     * @notice Revoke a credential (only the original issuer)
     * @param credentialHash Hash of the credential to revoke
     */
    function revokeCredential(bytes32 credentialHash) external {
        Credential storage cred = credentials[credentialHash];
        require(cred.issuedAt != 0, "Credential does not exist");
        require(cred.issuer == msg.sender, "Only issuer can revoke");
        require(!cred.revoked, "Already revoked");

        cred.revoked = true;
        emit CredentialRevoked(credentialHash, msg.sender);
    }

    /**
     * @notice Get all credentials for a worker
     * @param worker Address of the worker
     * @return Array of credential hashes
     */
    function getWorkerCredentials(address worker) external view returns (bytes32[] memory) {
        return workerCredentials[worker];
    }

    /**
     * @notice Get all credentials issued by an issuer
     * @param issuer Address of the issuer
     * @return Array of credential hashes
     */
    function getIssuerCredentials(address issuer) external view returns (bytes32[] memory) {
        return issuerCredentials[issuer];
    }

    /**
     * @notice Check if an address is a verified issuer
     * @param issuer Address to check
     * @return Whether the address is a verified issuer
     */
    function isVerifiedIssuer(address issuer) external view returns (bool) {
        return verifiedIssuers[issuer];
    }

    /**
     * @notice Get credential count for a worker
     * @param worker Address of the worker
     * @return Number of credentials
     */
    function getWorkerCredentialCount(address worker) external view returns (uint256) {
        return workerCredentials[worker].length;
    }
}
