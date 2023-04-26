// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract DemoNFT is ERC721 {
    mapping(uint256 => string) private _tokenMetadata;

    constructor() ERC721("DemoNFT", "DNFT") {}

    event MetadataChange(uint256 indexed nftId, string metaData);

    function mint(address to, uint256 tokenId, string memory _metaData) public {
        _safeMint(to, tokenId);
        _setTokenMetadata(tokenId, _metaData);
    }

    function _setTokenMetadata(
        uint256 tokenId,
        string memory _metaData
    ) public {
        _tokenMetadata[tokenId] = _metaData;
        emit MetadataChange(tokenId, _metaData);
    }

    function tokenMetadata(
        uint256 tokenId
    ) public view returns (string memory) {
        return _tokenMetadata[tokenId];
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        return tokenMetadata(tokenId);
    }
}
