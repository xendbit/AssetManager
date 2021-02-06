/// SPDX-License-Identifier: MIT-0
pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract ShareContract is IERC20{
    using SafeMath for uint256;
    uint256 private _issuingPrice;
    address _issuer;
    address assetManagerV2;

    mapping (address => uint256) private _balances;

    mapping (address => mapping (address => uint256)) private _allowances;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;
    uint8 private _decimals;

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() public view returns (uint8) {
        return _decimals;
    }

    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address recipient, uint256 amount) public override returns (bool) {
        address sender = msg.sender;
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");

        _balances[sender] = _balances[sender].sub(amount, "ERC20: transfer amount exceeds balance");
        _balances[recipient] = _balances[recipient].add(amount);
        emit Transfer(sender, recipient, amount);
        return true;
    }
    

    function allowance(address owner, address spender) public view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public override returns (bool) {
        address owner = msg.sender;
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        _allowances[owner][spender] = _allowances[owner][spender].add(amount);
        emit Approval(owner, spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");
        _balances[sender] = _balances[sender].sub(amount, "ERC20: transfer amount exceeds balance");
        _balances[recipient] = _balances[recipient].add(amount);
        emit Transfer(sender, recipient, amount);
        
        address owner = sender;
        address spender = assetManagerV2;
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        _allowances[owner][spender] = _allowances[sender][spender].sub(amount, "ERC20: transfer amount exceeds allowance");
        emit Approval(owner, spender, amount);        
        return true;
    }

    constructor (
        string memory symbol_,
        uint256 price_,
        address issuer_,
        uint8 decimals_,
        uint256 amount
    ) public {
        // constructor
        assetManagerV2 = msg.sender;
        _issuingPrice = price_;
        _symbol = symbol_;
        _issuer = issuer_;
        _decimals = decimals_;
        _totalSupply = _totalSupply.add(amount);
        _balances[issuer_] = _balances[issuer_].add(amount);
        _allowances[issuer_][assetManagerV2] = amount;
    }
    

    function mintToken(address owner, uint256 amount) public {
        require(assetManagerV2 == msg.sender, 'MBAMV2');
        require(owner != address(0), "ERC20: mint to the zero address");
        _totalSupply = _totalSupply.add(amount);
        _balances[owner] = _balances[owner].add(amount);
        
        address spender = assetManagerV2;
        _allowances[owner][spender] = _allowances[owner][spender].add(amount);
    }

    function issuingPrice() public view returns (uint256) {
        return _issuingPrice;
    }

    function issuer() public view returns (address) {
        return _issuer;
    }

    function allow(address owner, uint256 amount) public {
        require(assetManagerV2 == msg.sender, 'MBAMV2');
        address spender = assetManagerV2;
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        _allowances[owner][spender] = _allowances[owner][spender].add(amount);
    }

    function details(uint256 tokenId, address owner) public view returns (uint256, address, address, string memory, string memory, uint256, uint256, address) {
        return (tokenId, owner, address(this), name(), symbol(), totalSupply(), issuingPrice(), issuer());
    }
}