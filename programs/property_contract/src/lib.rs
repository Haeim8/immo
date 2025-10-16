use anchor_lang::prelude::*;

declare_id!("97eUkEnc8ycsVemeh65NEfh4P4nnPMSZReUG66fSe3Kr");

#[program]
pub mod property_contract {
    use super::*;

    /// Transfer a share NFT to another user
    pub fn transfer_share(ctx: Context<TransferShare>, transfer_count: u64) -> Result<()> {
        let share_nft = &mut ctx.accounts.share_nft;
        let old_owner = share_nft.owner;

        share_nft.owner = ctx.accounts.new_owner.key();

        // Record the transfer in history
        let transfer_record = &mut ctx.accounts.transfer_record;
        transfer_record.share_nft = share_nft.key();
        transfer_record.from = old_owner;
        transfer_record.to = ctx.accounts.new_owner.key();
        transfer_record.timestamp = Clock::get()?.unix_timestamp;
        transfer_record.bump = ctx.bumps.transfer_record;

        msg!("Share NFT transferred from {} to {}", old_owner, ctx.accounts.new_owner.key());
        Ok(())
    }

    /// Get property statistics
    pub fn get_property_stats(ctx: Context<GetPropertyStats>) -> Result<PropertyStats> {
        let property_stats = &ctx.accounts.property_stats;

        Ok(PropertyStats {
            total_investors: property_stats.total_investors,
            total_volume: property_stats.total_volume,
            total_transfers: property_stats.total_transfers,
            average_hold_time: property_stats.average_hold_time,
        })
    }

    /// Initialize property statistics tracking
    pub fn initialize_property_stats(ctx: Context<InitializePropertyStats>) -> Result<()> {
        let property_stats = &mut ctx.accounts.property_stats;

        property_stats.property = ctx.accounts.property.key();
        property_stats.total_investors = 0;
        property_stats.total_volume = 0;
        property_stats.total_transfers = 0;
        property_stats.average_hold_time = 0;
        property_stats.bump = ctx.bumps.property_stats;

        msg!("Property statistics initialized for {}", ctx.accounts.property.key());
        Ok(())
    }

    /// Add metadata to a property
    pub fn add_property_metadata(
        ctx: Context<AddPropertyMetadata>,
        metadata_key: String,
        metadata_value: String,
    ) -> Result<()> {
        require!(metadata_key.len() <= 64, PropertyError::MetadataKeyTooLong);
        require!(metadata_value.len() <= 256, PropertyError::MetadataValueTooLong);

        let property_metadata = &mut ctx.accounts.property_metadata;
        property_metadata.property = ctx.accounts.property.key();
        property_metadata.metadata_key = metadata_key.clone();
        property_metadata.metadata_value = metadata_value.clone();
        property_metadata.created_at = Clock::get()?.unix_timestamp;
        property_metadata.bump = ctx.bumps.property_metadata;

        msg!("Metadata added: {} = {}", metadata_key, metadata_value);
        Ok(())
    }
}

// ============== ACCOUNTS ==============

#[derive(Accounts)]
#[instruction(transfer_count: u64)]
pub struct TransferShare<'info> {
    #[account(
        mut,
        has_one = owner
    )]
    pub share_nft: Account<'info, ShareNFT>,

    #[account(
        init,
        payer = owner,
        space = 8 + TransferRecord::INIT_SPACE,
        seeds = [
            b"transfer",
            share_nft.key().as_ref(),
            &transfer_count.to_le_bytes()
        ],
        bump
    )]
    pub transfer_record: Account<'info, TransferRecord>,

    #[account(mut)]
    pub owner: Signer<'info>,

    /// CHECK: New owner address
    pub new_owner: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetPropertyStats<'info> {
    #[account(
        seeds = [b"property_stats", property.key().as_ref()],
        bump = property_stats.bump
    )]
    pub property_stats: Account<'info, PropertyStatsAccount>,

    /// CHECK: Property account reference
    pub property: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct InitializePropertyStats<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + PropertyStatsAccount::INIT_SPACE,
        seeds = [b"property_stats", property.key().as_ref()],
        bump
    )]
    pub property_stats: Account<'info, PropertyStatsAccount>,

    /// CHECK: Property account reference
    pub property: AccountInfo<'info>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(metadata_key: String)]
pub struct AddPropertyMetadata<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + PropertyMetadata::INIT_SPACE,
        seeds = [
            b"property_metadata",
            property.key().as_ref(),
            metadata_key.as_bytes()
        ],
        bump
    )]
    pub property_metadata: Account<'info, PropertyMetadata>,

    /// CHECK: Property account reference
    pub property: AccountInfo<'info>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// ============== DATA STRUCTURES ==============

#[account]
#[derive(InitSpace)]
pub struct ShareNFT {
    pub property: Pubkey,        // 32
    pub owner: Pubkey,           // 32
    pub token_id: u64,           // 8
    pub mint_time: i64,          // 8
    pub dividends_claimed: u64,  // 8
    pub bump: u8,                // 1
}

#[account]
#[derive(InitSpace)]
pub struct TransferRecord {
    pub share_nft: Pubkey,    // 32
    pub from: Pubkey,         // 32
    pub to: Pubkey,           // 32
    pub timestamp: i64,       // 8
    pub bump: u8,             // 1
}

#[account]
#[derive(InitSpace)]
pub struct PropertyStatsAccount {
    pub property: Pubkey,          // 32
    pub total_investors: u64,      // 8
    pub total_volume: u64,         // 8
    pub total_transfers: u64,      // 8
    pub average_hold_time: i64,    // 8
    pub bump: u8,                  // 1
}

#[account]
#[derive(InitSpace)]
pub struct PropertyMetadata {
    pub property: Pubkey,           // 32
    #[max_len(64)]
    pub metadata_key: String,       // 4 + 64
    #[max_len(256)]
    pub metadata_value: String,     // 4 + 256
    pub created_at: i64,            // 8
    pub bump: u8,                   // 1
}

// ============== RETURN TYPES ==============

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PropertyStats {
    pub total_investors: u64,
    pub total_volume: u64,
    pub total_transfers: u64,
    pub average_hold_time: i64,
}

// ============== ERRORS ==============

#[error_code]
pub enum PropertyError {
    #[msg("Metadata key is too long (max 64 characters)")]
    MetadataKeyTooLong,
    #[msg("Metadata value is too long (max 256 characters)")]
    MetadataValueTooLong,
}
