//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract UserRegistry {
    event UserRegistered(address user, address inviteAddress);
    error AddressWasRegistered(address user);

    struct InviteInfomation {
        uint8 signUpWithCode;
        address[] invited;
    }
    mapping(address => InviteInfomation) userInviteInfomation;

    function regist(address inviteAddress) public {
        InviteInfomation storage userInfo = userInviteInfomation[msg.sender];

        if (userInfo.signUpWithCode != 0) {
            revert AddressWasRegistered(msg.sender);
        }

        InviteInfomation storage inviteUserInfo = userInviteInfomation[
            inviteAddress
        ];

        if (inviteUserInfo.signUpWithCode != 0) {
            inviteUserInfo.invited.push(inviteAddress);
            userInfo.signUpWithCode = 10;
        } else {
            userInfo.signUpWithCode = 1;
        }

        emit UserRegistered(msg.sender, inviteAddress);
    }
}
