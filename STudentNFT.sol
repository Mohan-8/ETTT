// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract StudentNFT is ERC721 {
   
    // Declaring student details
    struct Student {
        string First_name;
        string Last_name;
        string Reg_Num;
        string Course;
        string lang;
    }

    mapping(uint256 => Student) public students;
    mapping(uint256 => string) private _tokenURIs;
    uint256 public totalStudents;
    uint256 private tokenIdCounter;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {
        tokenIdCounter = 0;
    }

    event TokenMinted(uint256 tokenId);
    event MetadataUpdate(uint256 tokenId);
    
    // Function to mint a single student NFT
    function mintStudent(
        string memory First_name, 
        string memory Last_name, 
        string memory Reg_Num,
        string memory Course,
        string memory lang
    ) public {
        uint256 tokenId = tokenIdCounter++;
        students[tokenId] = Student(First_name, Last_name, Reg_Num, Course, lang);
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, "https://example.com/metadata/{id}.json"); // Example URI
        totalStudents++;
        emit TokenMinted(tokenId);
    }

    // Function to get student details by token ID
    function getStudentDetails(uint256 _tokenId) public view returns (string memory, string memory, string memory, string memory, string memory) {
        Student memory student = students[_tokenId];
        return (student.First_name, student.Last_name, student.Reg_Num, student.Course, student.lang);
    }

    // Function to return total number of students minted
    function TotalStudents() public view returns (uint256) {
        return totalStudents;
    }

    // Insert Token URI
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
        _tokenURIs[tokenId] = _tokenURI;
        emit MetadataUpdate(tokenId);
    }

    // Read Token URI
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        string memory _tokenURI = _tokenURIs[tokenId];
        return _tokenURI;
    }
}
