/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/real_estate_factory.json`.
 */
export type RealEstateFactory = {
  "address": "BHyYjFqUQxMw6YNj9s4k82ngMHjby4Pn463J6epEDyKq",
  "metadata": {
    "name": "realEstateFactory",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Factory contract for creating real estate investment properties"
  },
  "instructions": [
    {
      "name": "addTeamMember",
      "docs": [
        "Add team member (admin only)"
      ],
      "discriminator": [
        64,
        13,
        248,
        67,
        55,
        245,
        184,
        173
      ],
      "accounts": [
        {
          "name": "factory",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  97,
                  99,
                  116,
                  111,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "teamMember",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  101,
                  97,
                  109,
                  95,
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "factory"
              },
              {
                "kind": "account",
                "path": "wallet"
              }
            ]
          }
        },
        {
          "name": "wallet"
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "wallet",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "buyShare",
      "docs": [
        "Buy a share NFT (minted on-demand)"
      ],
      "discriminator": [
        225,
        72,
        68,
        20,
        61,
        152,
        46,
        177
      ],
      "accounts": [
        {
          "name": "factory",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  97,
                  99,
                  116,
                  111,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "property",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  101,
                  114,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "factory"
              },
              {
                "kind": "account",
                "path": "property.property_id",
                "account": "property"
              }
            ]
          }
        },
        {
          "name": "shareNft",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  104,
                  97,
                  114,
                  101,
                  95,
                  110,
                  102,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "property"
              },
              {
                "kind": "account",
                "path": "property.shares_sold",
                "account": "property"
              }
            ]
          }
        },
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "treasury",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "nftImageCid",
          "type": "string"
        },
        {
          "name": "nftMetadataCid",
          "type": "string"
        }
      ]
    },
    {
      "name": "castVote",
      "docs": [
        "Cast a vote (NFT holders only)"
      ],
      "discriminator": [
        20,
        212,
        15,
        189,
        69,
        180,
        69,
        151
      ],
      "accounts": [
        {
          "name": "property",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  101,
                  114,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "property.factory",
                "account": "property"
              },
              {
                "kind": "account",
                "path": "property.property_id",
                "account": "property"
              }
            ]
          }
        },
        {
          "name": "proposal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "property"
              },
              {
                "kind": "account",
                "path": "proposal.proposal_id",
                "account": "proposal"
              }
            ]
          }
        },
        {
          "name": "shareNft",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  104,
                  97,
                  114,
                  101,
                  95,
                  110,
                  102,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "property"
              },
              {
                "kind": "account",
                "path": "share_nft.token_id",
                "account": "shareNft"
              }
            ]
          }
        },
        {
          "name": "vote",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "proposal"
              },
              {
                "kind": "account",
                "path": "shareNft"
              }
            ]
          }
        },
        {
          "name": "voter",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "voteChoice",
          "type": "bool"
        }
      ]
    },
    {
      "name": "claimDividends",
      "docs": [
        "Claim dividends proportional to NFT ownership"
      ],
      "discriminator": [
        105,
        60,
        172,
        2,
        136,
        93,
        128,
        151
      ],
      "accounts": [
        {
          "name": "property",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  101,
                  114,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "property.factory",
                "account": "property"
              },
              {
                "kind": "account",
                "path": "property.property_id",
                "account": "property"
              }
            ]
          }
        },
        {
          "name": "shareNft",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  104,
                  97,
                  114,
                  101,
                  95,
                  110,
                  102,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "property"
              },
              {
                "kind": "account",
                "path": "share_nft.token_id",
                "account": "shareNft"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "shareNft"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "closePropertySale",
      "docs": [
        "Close a property sale"
      ],
      "discriminator": [
        135,
        76,
        215,
        58,
        159,
        111,
        56,
        227
      ],
      "accounts": [
        {
          "name": "factory",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  97,
                  99,
                  116,
                  111,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "property",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  101,
                  114,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "factory"
              },
              {
                "kind": "account",
                "path": "property.property_id",
                "account": "property"
              }
            ]
          }
        },
        {
          "name": "admin",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "closeProposal",
      "docs": [
        "Close a proposal (admin only)"
      ],
      "discriminator": [
        213,
        178,
        139,
        19,
        50,
        191,
        82,
        245
      ],
      "accounts": [
        {
          "name": "factory",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  97,
                  99,
                  116,
                  111,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "property",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  101,
                  114,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "factory"
              },
              {
                "kind": "account",
                "path": "property.property_id",
                "account": "property"
              }
            ]
          }
        },
        {
          "name": "proposal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "property"
              },
              {
                "kind": "account",
                "path": "proposal.proposal_id",
                "account": "proposal"
              }
            ]
          }
        },
        {
          "name": "admin",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "createProperty",
      "docs": [
        "Create a new asset tokenization contract (property, vehicle, business, etc.)"
      ],
      "discriminator": [
        45,
        115,
        89,
        113,
        193,
        252,
        125,
        27
      ],
      "accounts": [
        {
          "name": "factory",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  97,
                  99,
                  116,
                  111,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "property",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  101,
                  114,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "factory"
              },
              {
                "kind": "account",
                "path": "factory.property_count",
                "account": "factory"
              }
            ]
          }
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "assetType",
          "type": "string"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "city",
          "type": "string"
        },
        {
          "name": "province",
          "type": "string"
        },
        {
          "name": "country",
          "type": "string"
        },
        {
          "name": "totalShares",
          "type": "u64"
        },
        {
          "name": "sharePrice",
          "type": "u64"
        },
        {
          "name": "saleDuration",
          "type": "i64"
        },
        {
          "name": "surface",
          "type": "u32"
        },
        {
          "name": "rooms",
          "type": "u8"
        },
        {
          "name": "expectedReturn",
          "type": "u32"
        },
        {
          "name": "propertyType",
          "type": "string"
        },
        {
          "name": "yearBuilt",
          "type": "u16"
        },
        {
          "name": "imageCid",
          "type": "string"
        },
        {
          "name": "metadataCid",
          "type": "string"
        },
        {
          "name": "votingEnabled",
          "type": "bool"
        }
      ]
    },
    {
      "name": "createProposal",
      "docs": [
        "Create a proposal for voting (admin only)"
      ],
      "discriminator": [
        132,
        116,
        68,
        174,
        216,
        160,
        198,
        22
      ],
      "accounts": [
        {
          "name": "factory",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  97,
                  99,
                  116,
                  111,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "property",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  101,
                  114,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "factory"
              },
              {
                "kind": "account",
                "path": "property.property_id",
                "account": "property"
              }
            ]
          }
        },
        {
          "name": "proposal",
          "writable": true
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "votingDuration",
          "type": "i64"
        }
      ]
    },
    {
      "name": "depositDividends",
      "docs": [
        "Deposit dividends for a specific property"
      ],
      "discriminator": [
        180,
        188,
        28,
        154,
        131,
        160,
        139,
        90
      ],
      "accounts": [
        {
          "name": "factory",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  97,
                  99,
                  116,
                  111,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "property",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  101,
                  114,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "factory"
              },
              {
                "kind": "account",
                "path": "property.property_id",
                "account": "property"
              }
            ]
          }
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initialize",
      "docs": [
        "Initialize the factory with treasury wallet"
      ],
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "factory",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  97,
                  99,
                  116,
                  111,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "treasury"
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "admin",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "removeTeamMember",
      "docs": [
        "Remove team member (admin only)"
      ],
      "discriminator": [
        224,
        54,
        115,
        192,
        42,
        203,
        4,
        15
      ],
      "accounts": [
        {
          "name": "factory",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  97,
                  99,
                  116,
                  111,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "teamMember",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  101,
                  97,
                  109,
                  95,
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "factory"
              },
              {
                "kind": "account",
                "path": "team_member.wallet",
                "account": "teamMember"
              }
            ]
          }
        },
        {
          "name": "admin",
          "signer": true
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "factory",
      "discriminator": [
        159,
        68,
        192,
        61,
        48,
        249,
        216,
        202
      ]
    },
    {
      "name": "property",
      "discriminator": [
        195,
        247,
        69,
        181,
        195,
        47,
        152,
        19
      ]
    },
    {
      "name": "proposal",
      "discriminator": [
        26,
        94,
        189,
        187,
        116,
        136,
        53,
        33
      ]
    },
    {
      "name": "shareNft",
      "discriminator": [
        143,
        169,
        240,
        82,
        138,
        31,
        24,
        65
      ]
    },
    {
      "name": "teamMember",
      "discriminator": [
        45,
        32,
        135,
        109,
        75,
        252,
        204,
        244
      ]
    },
    {
      "name": "vote",
      "discriminator": [
        96,
        91,
        104,
        57,
        145,
        35,
        172,
        155
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "assetTypeTooLong",
      "msg": "Asset type is too long (max 32 characters)"
    },
    {
      "code": 6001,
      "name": "nameTooLong",
      "msg": "Name is too long (max 64 characters)"
    },
    {
      "code": 6002,
      "name": "cityTooLong",
      "msg": "City is too long (max 64 characters)"
    },
    {
      "code": 6003,
      "name": "provinceTooLong",
      "msg": "Province is too long (max 64 characters)"
    },
    {
      "code": 6004,
      "name": "countryTooLong",
      "msg": "Country is too long (max 64 characters)"
    },
    {
      "code": 6005,
      "name": "typeTooLong",
      "msg": "Property type is too long (max 32 characters)"
    },
    {
      "code": 6006,
      "name": "imageCidTooLong",
      "msg": "Image CID is too long (max 100 characters)"
    },
    {
      "code": 6007,
      "name": "metadataCidTooLong",
      "msg": "Metadata CID is too long (max 100 characters)"
    },
    {
      "code": 6008,
      "name": "invalidShareAmount",
      "msg": "Invalid share amount"
    },
    {
      "code": 6009,
      "name": "invalidPrice",
      "msg": "Invalid price"
    },
    {
      "code": 6010,
      "name": "saleEnded",
      "msg": "Sale has ended"
    },
    {
      "code": 6011,
      "name": "propertyInactive",
      "msg": "Property is inactive"
    },
    {
      "code": 6012,
      "name": "allSharesSold",
      "msg": "All shares have been sold"
    },
    {
      "code": 6013,
      "name": "invalidAmount",
      "msg": "Invalid amount"
    },
    {
      "code": 6014,
      "name": "noSharesSold",
      "msg": "No shares have been sold yet"
    },
    {
      "code": 6015,
      "name": "mathOverflow",
      "msg": "Math overflow"
    },
    {
      "code": 6016,
      "name": "noDividendsToClaim",
      "msg": "No dividends to claim"
    },
    {
      "code": 6017,
      "name": "saleStillActive",
      "msg": "Sale is still active"
    },
    {
      "code": 6018,
      "name": "titleTooLong",
      "msg": "Title is too long (max 200 characters)"
    },
    {
      "code": 6019,
      "name": "descriptionTooLong",
      "msg": "Description is too long (max 1000 characters)"
    },
    {
      "code": 6020,
      "name": "invalidDuration",
      "msg": "Invalid voting duration"
    },
    {
      "code": 6021,
      "name": "votingDisabled",
      "msg": "Voting is disabled for this property"
    },
    {
      "code": 6022,
      "name": "proposalInactive",
      "msg": "Proposal is inactive"
    },
    {
      "code": 6023,
      "name": "votingEnded",
      "msg": "Voting has ended"
    },
    {
      "code": 6024,
      "name": "notNftOwner",
      "msg": "You do not own this NFT"
    },
    {
      "code": 6025,
      "name": "wrongProperty",
      "msg": "NFT does not belong to this property"
    },
    {
      "code": 6026,
      "name": "noVotingPower",
      "msg": "This NFT has no voting power"
    },
    {
      "code": 6027,
      "name": "votingStillActive",
      "msg": "Voting is still active"
    },
    {
      "code": 6028,
      "name": "unauthorized",
      "msg": "Unauthorized: Only admin or team members can perform this action"
    }
  ],
  "types": [
    {
      "name": "factory",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "type": "pubkey"
          },
          {
            "name": "propertyCount",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "property",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "factory",
            "type": "pubkey"
          },
          {
            "name": "propertyId",
            "type": "u64"
          },
          {
            "name": "assetType",
            "type": "string"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "city",
            "type": "string"
          },
          {
            "name": "province",
            "type": "string"
          },
          {
            "name": "country",
            "type": "string"
          },
          {
            "name": "totalShares",
            "type": "u64"
          },
          {
            "name": "sharePrice",
            "type": "u64"
          },
          {
            "name": "sharesSold",
            "type": "u64"
          },
          {
            "name": "saleStart",
            "type": "i64"
          },
          {
            "name": "saleEnd",
            "type": "i64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "surface",
            "type": "u32"
          },
          {
            "name": "rooms",
            "type": "u8"
          },
          {
            "name": "expectedReturn",
            "type": "u32"
          },
          {
            "name": "propertyType",
            "type": "string"
          },
          {
            "name": "yearBuilt",
            "type": "u16"
          },
          {
            "name": "imageCid",
            "type": "string"
          },
          {
            "name": "metadataCid",
            "type": "string"
          },
          {
            "name": "votingEnabled",
            "type": "bool"
          },
          {
            "name": "totalDividendsDeposited",
            "type": "u64"
          },
          {
            "name": "totalDividendsClaimed",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "proposal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "property",
            "type": "pubkey"
          },
          {
            "name": "proposalId",
            "type": "u64"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "votingEndsAt",
            "type": "i64"
          },
          {
            "name": "yesVotes",
            "type": "u64"
          },
          {
            "name": "noVotes",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "isExecuted",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "shareNft",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "property",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "tokenId",
            "type": "u64"
          },
          {
            "name": "mintTime",
            "type": "i64"
          },
          {
            "name": "dividendsClaimed",
            "type": "u64"
          },
          {
            "name": "nftImageUri",
            "type": "string"
          },
          {
            "name": "nftMetadataUri",
            "type": "string"
          },
          {
            "name": "votingPower",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "teamMember",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "factory",
            "type": "pubkey"
          },
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "addedBy",
            "type": "pubkey"
          },
          {
            "name": "addedAt",
            "type": "i64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "vote",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "type": "pubkey"
          },
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "shareNft",
            "type": "pubkey"
          },
          {
            "name": "voteChoice",
            "type": "bool"
          },
          {
            "name": "votedAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
