use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("HZp9dtYNuCC7AUapf8FZmdU83S5UH8AU21ffbpTTXQ6J");

fn assert_authorized(
    program_id: &Pubkey,
    factory: &Account<Factory>,
    authority: &Signer,
    team_member: &Option<Account<TeamMember>>,
) -> Result<()> {
    if authority.key() == factory.admin {
        return Ok(());
    }

    if let Some(member) = team_member {
        require!(member.is_active, FactoryError::TeamMemberInactive);
        require!(member.factory == factory.key(), FactoryError::Unauthorized);
        require!(member.wallet == authority.key(), FactoryError::Unauthorized);

        let (expected_pda, _) = Pubkey::find_program_address(
            &[b"team_member", factory.key().as_ref(), authority.key().as_ref()],
            program_id,
        );
        require!(expected_pda == member.key(), FactoryError::Unauthorized);
        Ok(())
    } else {
        err!(FactoryError::Unauthorized)
    }
}

#[program]
pub mod real_estate_factory {
    use super::*;

    /// Initialize the factory with treasury wallet
    pub fn initialize(ctx: Context<Initialize>, admin: Pubkey) -> Result<()> {
        let factory = &mut ctx.accounts.factory;
        factory.admin = admin;
        factory.treasury = ctx.accounts.treasury.key();
        factory.property_count = 0;
        factory.bump = ctx.bumps.factory;

        msg!("Factory initialized with treasury: {}", factory.treasury);
        Ok(())
    }

    /// Create a new asset tokenization contract (property, vehicle, business, etc.)
    pub fn create_property(
        ctx: Context<CreateProperty>,
        asset_type: String,         // "real_estate", "vehicle", "business", "collectible"
        name: String,
        city: String,
        province: String,
        country: String,
        total_shares: u64,
        share_price: u64,           // Price in lamports
        sale_duration: i64,         // Duration in seconds
        surface: u32,               // Surface in m² (or other unit)
        rooms: u8,                  // Number of rooms (or other metric)
        expected_return: u32,       // Expected return in basis points (550 = 5.50%)
        property_type: String,      // "Résidentiel", "Commercial", "Sedan", "SUV", etc.
        year_built: u16,            // Year built/manufactured
        image_cid: String,          // IPFS CID for main image
        metadata_cid: String,       // IPFS CID for full property metadata JSON
        voting_enabled: bool,       // Enable voting for investors
    ) -> Result<()> {
        require!(asset_type.len() <= 32, FactoryError::AssetTypeTooLong);
        require!(name.len() <= 64, FactoryError::NameTooLong);
        require!(city.len() <= 64, FactoryError::CityTooLong);
        require!(province.len() <= 64, FactoryError::ProvinceTooLong);
        require!(country.len() <= 64, FactoryError::CountryTooLong);
        require!(property_type.len() <= 32, FactoryError::TypeTooLong);
        require!(image_cid.len() <= 100, FactoryError::ImageCidTooLong);
        require!(metadata_cid.len() <= 100, FactoryError::MetadataCidTooLong);
        require!(total_shares > 0, FactoryError::InvalidShareAmount);
        require!(share_price > 0, FactoryError::InvalidPrice);

        assert_authorized(
            ctx.program_id,
            &ctx.accounts.factory,
            &ctx.accounts.authority,
            &ctx.accounts.team_member,
        )?;

        let factory = &mut ctx.accounts.factory;
        let property = &mut ctx.accounts.property;

        let clock = Clock::get()?;

        property.factory = factory.key();
        property.property_id = factory.property_count;
        property.asset_type = asset_type.clone();
        property.name = name.clone();
        property.city = city;
        property.province = province;
        property.country = country;
        property.total_shares = total_shares;
        property.share_price = share_price;
        property.shares_sold = 0;
        property.sale_start = clock.unix_timestamp;
        property.sale_end = clock.unix_timestamp + sale_duration;
        property.is_active = true;
        property.surface = surface;
        property.rooms = rooms;
        property.expected_return = expected_return;
        property.property_type = property_type;
        property.year_built = year_built;
        property.image_cid = image_cid.clone();
        property.metadata_cid = metadata_cid.clone();
        property.voting_enabled = voting_enabled;
        property.total_dividends_deposited = 0;
        property.total_dividends_claimed = 0;
        property.proposal_count = 0;
        property.is_liquidated = false;
        property.liquidation_amount = 0;
        property.liquidation_claimed = 0;
        property.bump = ctx.bumps.property;

        factory.property_count += 1;

        msg!("Asset created: {} (ID: {}, Type: {})", name, property.property_id, asset_type);
        msg!("Total shares: {}, Price: {} lamports", total_shares, share_price);
        msg!("Image CID: {}, Metadata CID: {}", image_cid, metadata_cid);
        msg!("Voting enabled: {}", voting_enabled);

        Ok(())
    }

    /// Buy a share NFT (minted on-demand)
    pub fn buy_share(
        ctx: Context<BuyShare>,
        nft_svg_data: String,       // ON-CHAIN SVG data with embedded property image
    ) -> Result<()> {
        require!(nft_svg_data.len() <= 5000, FactoryError::SvgDataTooLong);
        require!(nft_svg_data.len() > 0, FactoryError::EmptySvgData);

        let property = &mut ctx.accounts.property;
        let _factory = &ctx.accounts.factory;

        // Check if sale is still active
        let clock = Clock::get()?;
        require!(clock.unix_timestamp <= property.sale_end, FactoryError::SaleEnded);
        require!(property.is_active, FactoryError::PropertyInactive);
        require!(property.shares_sold < property.total_shares, FactoryError::AllSharesSold);

        // Transfer payment to treasury
        let transfer_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: ctx.accounts.treasury.to_account_info(),
            },
        );
        transfer(transfer_ctx, property.share_price)?;

        // Create share NFT record with ON-CHAIN SVG
        let share_nft = &mut ctx.accounts.share_nft;
        share_nft.property = property.key();
        share_nft.owner = ctx.accounts.buyer.key();
        share_nft.token_id = property.shares_sold;
        share_nft.mint_time = clock.unix_timestamp;
        share_nft.dividends_claimed = 0;

        // Store on-chain SVG data
        share_nft.nft_svg_data = nft_svg_data.clone();

        // Keep old fields empty for compatibility
        share_nft.nft_image_uri = String::from("");
        share_nft.nft_metadata_uri = String::from("");

        // Set voting power (1 share = 1 vote if voting enabled)
        share_nft.voting_power = if property.voting_enabled { 1 } else { 0 };

        share_nft.bump = ctx.bumps.share_nft;

        property.shares_sold += 1;

        // Auto-close property sale if all shares are sold (SOLD OUT)
        if property.shares_sold >= property.total_shares {
            property.is_active = false;
            msg!("SOLD OUT! Property {} sale automatically closed", property.property_id);
            msg!("All {} shares have been sold", property.total_shares);
        }

        msg!("Share NFT #{} minted for property {} (ON-CHAIN SVG)", share_nft.token_id, property.property_id);
        msg!("Buyer: {}", ctx.accounts.buyer.key());
        msg!("SVG size: {} bytes", nft_svg_data.len());
        msg!("Voting power: {}", share_nft.voting_power);
        msg!("Payment {} lamports transferred to treasury", property.share_price);

        Ok(())
    }

    /// Deposit dividends for a specific property
    pub fn deposit_dividends(ctx: Context<DepositDividends>, amount: u64) -> Result<()> {
        require!(amount > 0, FactoryError::InvalidAmount);

        assert_authorized(
            ctx.program_id,
            &ctx.accounts.factory,
            &ctx.accounts.authority,
            &ctx.accounts.team_member,
        )?;

        // Transfer dividends to property PDA
        let transfer_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.authority.to_account_info(),
                to: ctx.accounts.property.to_account_info(),
            },
        );
        transfer(transfer_ctx, amount)?;

        let property = &mut ctx.accounts.property;
        property.total_dividends_deposited += amount;

        msg!("Dividends deposited: {} lamports for property {}", amount, property.property_id);
        Ok(())
    }

    /// Claim dividends proportional to NFT ownership
    pub fn claim_dividends(ctx: Context<ClaimDividends>) -> Result<()> {
        let property = &ctx.accounts.property;
        let share_nft = &ctx.accounts.share_nft;

        // Calculate claimable dividends
        let total_dividends = property.total_dividends_deposited;
        let total_shares = property.shares_sold; // Only sold shares are eligible

        require!(total_shares > 0, FactoryError::NoSharesSold);

        // Calculate dividends per share
        let dividends_per_share = total_dividends
            .checked_div(total_shares)
            .ok_or(FactoryError::MathOverflow)?;

        // Calculate unclaimed amount for this NFT
        let claimable = dividends_per_share
            .checked_sub(share_nft.dividends_claimed)
            .ok_or(FactoryError::NoDividendsToClaim)?;

        require!(claimable > 0, FactoryError::NoDividendsToClaim);

        // Transfer dividends from property PDA to owner
        {
            let property_info = ctx.accounts.property.to_account_info();
            let owner_info = ctx.accounts.owner.to_account_info();

            {
                let mut property_lamports = property_info.try_borrow_mut_lamports()?;
                let current_balance = **property_lamports;
                let updated_balance = current_balance
                    .checked_sub(claimable)
                    .ok_or(FactoryError::MathOverflow)?;
                **property_lamports = updated_balance;
            }

            {
                let mut owner_lamports = owner_info.try_borrow_mut_lamports()?;
                let current_balance = **owner_lamports;
                let updated_balance = current_balance
                    .checked_add(claimable)
                    .ok_or(FactoryError::MathOverflow)?;
                **owner_lamports = updated_balance;
            }
        }

        // Update claimed amounts (now we can get mutable references)
        let property_mut = &mut ctx.accounts.property;
        let share_nft_mut = &mut ctx.accounts.share_nft;
        share_nft_mut.dividends_claimed += claimable;
        property_mut.total_dividends_claimed += claimable;

        msg!("Dividends claimed: {} lamports", claimable);
        msg!("NFT #{} owner: {}", share_nft_mut.token_id, ctx.accounts.owner.key());

        Ok(())
    }

    /// Close a property sale
    pub fn close_property_sale(ctx: Context<ClosePropertySale>) -> Result<()> {
        assert_authorized(
            ctx.program_id,
            &ctx.accounts.factory,
            &ctx.accounts.authority,
            &ctx.accounts.team_member,
        )?;

        let property = &mut ctx.accounts.property;

        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp > property.sale_end,
            FactoryError::SaleStillActive
        );

        property.is_active = false;

        msg!("Property {} sale closed", property.property_id);
        msg!("Total shares sold: {} / {}", property.shares_sold, property.total_shares);

        Ok(())
    }

    /// Create a proposal for voting (admin only)
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        title: String,
        description: String,
        voting_duration: i64, // Duration in seconds
    ) -> Result<()> {
        require!(title.len() <= 200, FactoryError::TitleTooLong);
        require!(description.len() <= 1000, FactoryError::DescriptionTooLong);
        require!(voting_duration > 0, FactoryError::InvalidDuration);

        assert_authorized(
            ctx.program_id,
            &ctx.accounts.factory,
            &ctx.accounts.authority,
            &ctx.accounts.team_member,
        )?;

        let property = &mut ctx.accounts.property;
        require!(property.voting_enabled, FactoryError::VotingDisabled);

        let proposal = &mut ctx.accounts.proposal;
        let clock = Clock::get()?;
        let proposal_id = property.proposal_count;

        proposal.property = property.key();
        proposal.proposal_id = proposal_id;
        proposal.title = title.clone();
        proposal.description = description;
        proposal.creator = ctx.accounts.authority.key();
        proposal.created_at = clock.unix_timestamp;
        proposal.voting_ends_at = clock.unix_timestamp + voting_duration;
        proposal.yes_votes = 0;
        proposal.no_votes = 0;
        proposal.is_active = true;
        proposal.is_executed = false;
        proposal.bump = ctx.bumps.proposal;

        property.proposal_count = property
            .proposal_count
            .checked_add(1)
            .ok_or(FactoryError::MathOverflow)?;

        msg!("Proposal created: {}", title);
        msg!("Voting ends at: {}", proposal.voting_ends_at);
        msg!("Proposal ID: {}", proposal_id);

        Ok(())
    }

    /// Cast a vote (NFT holders only)
    pub fn cast_vote(
        ctx: Context<CastVote>,
        vote_choice: bool, // true = yes, false = no
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let share_nft = &ctx.accounts.share_nft;
        let property = &ctx.accounts.property;

        // Verify voting is enabled
        require!(property.voting_enabled, FactoryError::VotingDisabled);

        // Verify proposal is still active
        require!(proposal.is_active, FactoryError::ProposalInactive);

        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp <= proposal.voting_ends_at,
            FactoryError::VotingEnded
        );

        // Verify voter owns the NFT
        require!(
            share_nft.owner == ctx.accounts.voter.key(),
            FactoryError::NotNftOwner
        );

        // Verify NFT belongs to this property
        require!(
            share_nft.property == property.key(),
            FactoryError::WrongProperty
        );

        // Verify NFT has voting power
        require!(share_nft.voting_power > 0, FactoryError::NoVotingPower);

        // Record the vote
        let vote = &mut ctx.accounts.vote;
        vote.proposal = proposal.key();
        vote.voter = ctx.accounts.voter.key();
        vote.share_nft = share_nft.key();
        vote.vote_choice = vote_choice;
        vote.voted_at = clock.unix_timestamp;
        vote.bump = ctx.bumps.vote;

        // Update vote counts (1 NFT = 1 vote)
        if vote_choice {
            proposal.yes_votes += 1;
        } else {
            proposal.no_votes += 1;
        }

        msg!("Vote cast by: {}", ctx.accounts.voter.key());
        msg!("NFT #{} used for voting", share_nft.token_id);
        msg!("Vote: {}", if vote_choice { "YES" } else { "NO" });

        Ok(())
    }

    /// Close a proposal (admin only)
    pub fn close_proposal(ctx: Context<CloseProposal>) -> Result<()> {
        assert_authorized(
            ctx.program_id,
            &ctx.accounts.factory,
            &ctx.accounts.authority,
            &ctx.accounts.team_member,
        )?;

        let proposal = &mut ctx.accounts.proposal;

        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp > proposal.voting_ends_at,
            FactoryError::VotingStillActive
        );

        proposal.is_active = false;

        msg!("Proposal closed");
        msg!("Results - Yes: {}, No: {}", proposal.yes_votes, proposal.no_votes);

        Ok(())
    }

    /// Add team member (admin only)
    pub fn add_team_member(ctx: Context<AddTeamMember>, wallet: Pubkey) -> Result<()> {
        let team_member = &mut ctx.accounts.team_member;
        let clock = Clock::get()?;

        team_member.factory = ctx.accounts.factory.key();
        team_member.wallet = wallet;
        team_member.added_by = ctx.accounts.admin.key();
        team_member.added_at = clock.unix_timestamp;
        team_member.is_active = true;
        team_member.bump = ctx.bumps.team_member;

        msg!("Team member added: {}", wallet);
        msg!("Added by: {}", ctx.accounts.admin.key());

        Ok(())
    }

    /// Remove team member (admin only)
    pub fn remove_team_member(ctx: Context<RemoveTeamMember>) -> Result<()> {
        let team_member = &mut ctx.accounts.team_member;

        team_member.is_active = false;

        msg!("Team member removed: {}", team_member.wallet);

        Ok(())
    }

    /// Liquidate property (admin deposits final sale proceeds)
    pub fn liquidate_property(
        ctx: Context<LiquidateProperty>,
        total_sale_amount: u64,
    ) -> Result<()> {
        require!(total_sale_amount > 0, FactoryError::InvalidAmount);

        assert_authorized(
            ctx.program_id,
            &ctx.accounts.factory,
            &ctx.accounts.authority,
            &ctx.accounts.team_member,
        )?;

        let property_info = ctx.accounts.property.to_account_info();
        let authority_info = ctx.accounts.authority.to_account_info();
        let system_program = ctx.accounts.system_program.to_account_info();

        let property = &ctx.accounts.property;

        // Verify all shares have been sold
        require!(
            property.shares_sold == property.total_shares,
            FactoryError::NoSharesSold
        );

        // Verify property is not active anymore
        require!(!property.is_active, FactoryError::SaleStillActive);

        // Verify not already liquidated
        require!(!property.is_liquidated, FactoryError::AlreadyLiquidated);

        require!(
            total_sale_amount % property.total_shares == 0,
            FactoryError::InvalidAmount
        );

        // Mutable borrow after readonly checks
        let property = &mut ctx.accounts.property;

        // Transfer liquidation funds from admin to property PDA
        let transfer_ctx = CpiContext::new(
            system_program,
            Transfer {
                from: authority_info,
                to: property_info.clone(),
            },
        );
        transfer(transfer_ctx, total_sale_amount)?;

        // Mark property as liquidated
        property.is_liquidated = true;
        property.liquidation_amount = total_sale_amount;
        property.liquidation_claimed = 0;

        msg!(
            "Property {} liquidated for {} lamports",
            property.property_id,
            total_sale_amount
        );
        msg!("Amount per share: {} lamports", total_sale_amount / property.total_shares);

        Ok(())
    }

    /// Claim liquidation proceeds and burn NFT
    pub fn claim_liquidation(ctx: Context<ClaimLiquidation>) -> Result<()> {
        let property_info = ctx.accounts.property.to_account_info();
        let owner_info = ctx.accounts.owner.to_account_info();
        let share_nft = &ctx.accounts.share_nft;

        let property_account = &ctx.accounts.property;

        // Verify property is liquidated
        require!(property_account.is_liquidated, FactoryError::NotLiquidated);

        // Verify NFT owner
        require!(
            share_nft.owner == ctx.accounts.owner.key(),
            FactoryError::NotNftOwner
        );

        // Verify NFT belongs to this property
        require!(
            share_nft.property == property_account.key(),
            FactoryError::WrongProperty
        );

        // Calculate claimable amount
        let amount_per_share = property_account
            .liquidation_amount
            .checked_div(property_account.total_shares)
            .ok_or(FactoryError::MathOverflow)?;

        // Transfer liquidation proceeds from property PDA to NFT owner
        {
            {
                let mut property_lamports = property_info.try_borrow_mut_lamports()?;
                let current_balance = **property_lamports;
                let updated_balance = current_balance
                    .checked_sub(amount_per_share)
                    .ok_or(FactoryError::MathOverflow)?;
                **property_lamports = updated_balance;
            }

            {
                let mut owner_lamports = owner_info.try_borrow_mut_lamports()?;
                let current_balance = **owner_lamports;
                let updated_balance = current_balance
                    .checked_add(amount_per_share)
                    .ok_or(FactoryError::MathOverflow)?;
                **owner_lamports = updated_balance;
            }
        }

        let property = &mut ctx.accounts.property;
        let share_nft = &ctx.accounts.share_nft;

        let new_total_claimed = property
            .liquidation_claimed
            .checked_add(amount_per_share)
            .ok_or(FactoryError::MathOverflow)?;
        require!(
            new_total_claimed <= property.liquidation_amount,
            FactoryError::LiquidationInsufficientFunds
        );

        property.liquidation_claimed = new_total_claimed;

        msg!("Liquidation claimed: {} lamports for NFT #{}", amount_per_share, share_nft.token_id);
        msg!("NFT will be closed (burned)");

        // Note: The NFT account will be closed automatically by Anchor's 'close' constraint
        // Rent lamports will be returned to the owner

        Ok(())
    }

    /// Update factory admin (current admin only)
    pub fn update_admin(ctx: Context<UpdateAdmin>, new_admin: Pubkey) -> Result<()> {
        let factory = &mut ctx.accounts.factory;
        factory.admin = new_admin;

        msg!("Factory admin updated to {}", new_admin);

        Ok(())
    }
}

// ============== ACCOUNTS ==============

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + Factory::INIT_SPACE,
        seeds = [b"factory"],
        bump
    )]
    pub factory: Account<'info, Factory>,

    /// CHECK: Treasury account to receive funds
    pub treasury: AccountInfo<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateProperty<'info> {
    #[account(
        mut,
        seeds = [b"factory"],
        bump = factory.bump
    )]
    pub factory: Account<'info, Factory>,

    #[account(
        init,
        payer = authority,
        space = 8 + Property::INIT_SPACE,
        seeds = [b"property", factory.key().as_ref(), &factory.property_count.to_le_bytes()],
        bump
    )]
    pub property: Account<'info, Property>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub team_member: Option<Account<'info, TeamMember>>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyShare<'info> {
    #[account(seeds = [b"factory"], bump = factory.bump)]
    pub factory: Account<'info, Factory>,

    #[account(
        mut,
        seeds = [b"property", factory.key().as_ref(), &property.property_id.to_le_bytes()],
        bump = property.bump
    )]
    pub property: Account<'info, Property>,

    #[account(
        init,
        payer = buyer,
        space = 8 + ShareNFT::INIT_SPACE,
        seeds = [
            b"share_nft",
            property.key().as_ref(),
            &property.shares_sold.to_le_bytes()
        ],
        bump
    )]
    pub share_nft: Account<'info, ShareNFT>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: Treasury account from factory
    #[account(mut, address = factory.treasury)]
    pub treasury: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositDividends<'info> {
    #[account(seeds = [b"factory"], bump = factory.bump)]
    pub factory: Account<'info, Factory>,

    #[account(
        mut,
        seeds = [b"property", factory.key().as_ref(), &property.property_id.to_le_bytes()],
        bump = property.bump
    )]
    pub property: Account<'info, Property>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub team_member: Option<Account<'info, TeamMember>>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimDividends<'info> {
    #[account(
        mut,
        seeds = [b"property", property.factory.as_ref(), &property.property_id.to_le_bytes()],
        bump = property.bump
    )]
    pub property: Account<'info, Property>,

    #[account(
        mut,
        seeds = [
            b"share_nft",
            property.key().as_ref(),
            &share_nft.token_id.to_le_bytes()
        ],
        bump = share_nft.bump,
        has_one = owner
    )]
    pub share_nft: Account<'info, ShareNFT>,

    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClosePropertySale<'info> {
    #[account(seeds = [b"factory"], bump = factory.bump)]
    pub factory: Account<'info, Factory>,

    #[account(
        mut,
        seeds = [b"property", factory.key().as_ref(), &property.property_id.to_le_bytes()],
        bump = property.bump
    )]
    pub property: Account<'info, Property>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub team_member: Option<Account<'info, TeamMember>>,
}

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(seeds = [b"factory"], bump = factory.bump)]
    pub factory: Account<'info, Factory>,

    #[account(
        mut,
        seeds = [b"property", factory.key().as_ref(), &property.property_id.to_le_bytes()],
        bump = property.bump
    )]
    pub property: Account<'info, Property>,

    #[account(
        init,
        payer = authority,
        space = 8 + Proposal::INIT_SPACE,
        seeds = [
            b"proposal",
            property.key().as_ref(),
            &property.proposal_count.to_le_bytes()
        ],
        bump
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub team_member: Option<Account<'info, TeamMember>>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(
        seeds = [b"property", property.factory.as_ref(), &property.property_id.to_le_bytes()],
        bump = property.bump
    )]
    pub property: Account<'info, Property>,

    #[account(
        mut,
        seeds = [b"proposal", property.key().as_ref(), &proposal.proposal_id.to_le_bytes()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(
        seeds = [
            b"share_nft",
            property.key().as_ref(),
            &share_nft.token_id.to_le_bytes()
        ],
        bump = share_nft.bump
    )]
    pub share_nft: Account<'info, ShareNFT>,

    #[account(
        init,
        payer = voter,
        space = 8 + Vote::INIT_SPACE,
        seeds = [b"vote", proposal.key().as_ref(), share_nft.key().as_ref()],
        bump
    )]
    pub vote: Account<'info, Vote>,

    #[account(mut)]
    pub voter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseProposal<'info> {
    #[account(seeds = [b"factory"], bump = factory.bump)]
    pub factory: Account<'info, Factory>,

    #[account(
        seeds = [b"property", factory.key().as_ref(), &property.property_id.to_le_bytes()],
        bump = property.bump
    )]
    pub property: Account<'info, Property>,

    #[account(
        mut,
        seeds = [b"proposal", property.key().as_ref(), &proposal.proposal_id.to_le_bytes()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub team_member: Option<Account<'info, TeamMember>>,
}

#[derive(Accounts)]
pub struct AddTeamMember<'info> {
    #[account(seeds = [b"factory"], bump = factory.bump)]
    pub factory: Account<'info, Factory>,

    #[account(
        init,
        payer = admin,
        space = 8 + TeamMember::INIT_SPACE,
        seeds = [b"team_member", factory.key().as_ref(), wallet.key().as_ref()],
        bump
    )]
    pub team_member: Account<'info, TeamMember>,

    /// CHECK: The wallet to add as team member
    pub wallet: AccountInfo<'info>,

    #[account(mut, address = factory.admin)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RemoveTeamMember<'info> {
    #[account(seeds = [b"factory"], bump = factory.bump)]
    pub factory: Account<'info, Factory>,

    #[account(
        mut,
        seeds = [b"team_member", factory.key().as_ref(), team_member.wallet.as_ref()],
        bump = team_member.bump
    )]
    pub team_member: Account<'info, TeamMember>,

    #[account(address = factory.admin)]
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct LiquidateProperty<'info> {
    #[account(seeds = [b"factory"], bump = factory.bump)]
    pub factory: Account<'info, Factory>,

    #[account(
        mut,
        seeds = [b"property", factory.key().as_ref(), &property.property_id.to_le_bytes()],
        bump = property.bump
    )]
    pub property: Account<'info, Property>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub team_member: Option<Account<'info, TeamMember>>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimLiquidation<'info> {
    #[account(
        mut,
        seeds = [b"property", property.factory.as_ref(), &property.property_id.to_le_bytes()],
        bump = property.bump
    )]
    pub property: Account<'info, Property>,

    #[account(
        mut,
        close = owner,
        seeds = [b"share_nft", property.key().as_ref(), &share_nft.token_id.to_le_bytes()],
        bump = share_nft.bump
    )]
    pub share_nft: Account<'info, ShareNFT>,

    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateAdmin<'info> {
    #[account(mut, seeds = [b"factory"], bump = factory.bump)]
    pub factory: Account<'info, Factory>,

    #[account(mut, address = factory.admin)]
    pub admin: Signer<'info>,
}

// ============== DATA STRUCTURES ==============

#[account]
#[derive(InitSpace)]
pub struct Factory {
    pub admin: Pubkey,           // 32
    pub treasury: Pubkey,        // 32
    pub property_count: u64,     // 8
    pub bump: u8,                // 1
}

#[account]
#[derive(InitSpace)]
pub struct Property {
    pub factory: Pubkey,                  // 32
    pub property_id: u64,                 // 8
    #[max_len(32)]
    pub asset_type: String,               // 4 + 32 ("real_estate", "vehicle", "business", "collectible")
    #[max_len(64)]
    pub name: String,                     // 4 + 64
    #[max_len(64)]
    pub city: String,                     // 4 + 64
    #[max_len(64)]
    pub province: String,                 // 4 + 64
    #[max_len(64)]
    pub country: String,                  // 4 + 64
    pub total_shares: u64,                // 8
    pub share_price: u64,                 // 8
    pub shares_sold: u64,                 // 8
    pub sale_start: i64,                  // 8
    pub sale_end: i64,                    // 8
    pub is_active: bool,                  // 1
    pub surface: u32,                     // 4 (m² or other unit depending on asset_type)
    pub rooms: u8,                        // 1 (or other metric)
    pub expected_return: u32,             // 4 (basis points: 550 = 5.50%)
    #[max_len(32)]
    pub property_type: String,            // 4 + 32 ("Résidentiel", "Commercial", "Sedan", "SUV", etc.)
    pub year_built: u16,                  // 2 (or year manufactured)
    #[max_len(100)]
    pub image_cid: String,                // 4 + 100 (IPFS CID for main image)
    #[max_len(100)]
    pub metadata_cid: String,             // 4 + 100 (IPFS CID for full property metadata JSON)
    pub voting_enabled: bool,             // 1 (Enable voting for investors)
    pub total_dividends_deposited: u64,   // 8
    pub total_dividends_claimed: u64,     // 8
    pub proposal_count: u64,              // 8 (Number of proposals created for this property)
    pub is_liquidated: bool,              // 1 (Property has been sold/liquidated)
    pub liquidation_amount: u64,          // 8 (Total sale price for liquidation)
    pub liquidation_claimed: u64,         // 8 (Amount already claimed by investors)
    pub bump: u8,                         // 1
}

#[account]
#[derive(InitSpace)]
pub struct ShareNFT {
    pub property: Pubkey,        // 32
    pub owner: Pubkey,           // 32
    pub token_id: u64,           // 8
    pub mint_time: i64,          // 8
    pub dividends_claimed: u64,  // 8
    #[max_len(200)]
    pub nft_image_uri: String,   // 4 + 200 (DEPRECATED: kept for compatibility)
    #[max_len(200)]
    pub nft_metadata_uri: String, // 4 + 200 (DEPRECATED: kept for compatibility)
    pub voting_power: u64,       // 8 (Voting power = 1 share = 1 vote)
    pub bump: u8,                // 1
    #[max_len(5000)]
    pub nft_svg_data: String,    // 4 + 5000 (ON-CHAIN SVG with embedded property image - reduced for Solana limits)
}

#[account]
#[derive(InitSpace)]
pub struct Proposal {
    pub property: Pubkey,            // 32 (Property this proposal is for)
    pub proposal_id: u64,            // 8 (Unique proposal ID for this property)
    #[max_len(200)]
    pub title: String,               // 4 + 200 (Proposal title)
    #[max_len(1000)]
    pub description: String,         // 4 + 1000 (Proposal description)
    pub creator: Pubkey,             // 32 (Admin who created the proposal)
    pub created_at: i64,             // 8 (Timestamp)
    pub voting_ends_at: i64,         // 8 (Voting deadline)
    pub yes_votes: u64,              // 8 (Total yes votes)
    pub no_votes: u64,               // 8 (Total no votes)
    pub is_active: bool,             // 1 (Is voting still active)
    pub is_executed: bool,           // 1 (Has the proposal been executed)
    pub bump: u8,                    // 1
}

#[account]
#[derive(InitSpace)]
pub struct Vote {
    pub proposal: Pubkey,            // 32 (Proposal being voted on)
    pub voter: Pubkey,               // 32 (Voter wallet address)
    pub share_nft: Pubkey,           // 32 (ShareNFT used to vote)
    pub vote_choice: bool,           // 1 (true = yes, false = no)
    pub voted_at: i64,               // 8 (Timestamp)
    pub bump: u8,                    // 1
}

#[account]
#[derive(InitSpace)]
pub struct TeamMember {
    pub factory: Pubkey,             // 32 (Factory this team member belongs to)
    pub wallet: Pubkey,              // 32 (Team member wallet address)
    pub added_by: Pubkey,            // 32 (Admin who added this member)
    pub added_at: i64,               // 8 (Timestamp)
    pub is_active: bool,             // 1 (Is this member active)
    pub bump: u8,                    // 1
}

// ============== ERRORS ==============

#[error_code]
pub enum FactoryError {
    #[msg("Asset type is too long (max 32 characters)")]
    AssetTypeTooLong,
    #[msg("Name is too long (max 64 characters)")]
    NameTooLong,
    #[msg("City is too long (max 64 characters)")]
    CityTooLong,
    #[msg("Province is too long (max 64 characters)")]
    ProvinceTooLong,
    #[msg("Country is too long (max 64 characters)")]
    CountryTooLong,
    #[msg("Property type is too long (max 32 characters)")]
    TypeTooLong,
    #[msg("Image CID is too long (max 100 characters)")]
    ImageCidTooLong,
    #[msg("Metadata CID is too long (max 100 characters)")]
    MetadataCidTooLong,
    #[msg("Invalid share amount")]
    InvalidShareAmount,
    #[msg("Invalid price")]
    InvalidPrice,
    #[msg("Sale has ended")]
    SaleEnded,
    #[msg("Property is inactive")]
    PropertyInactive,
    #[msg("All shares have been sold")]
    AllSharesSold,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("No shares have been sold yet")]
    NoSharesSold,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("No dividends to claim")]
    NoDividendsToClaim,
    #[msg("Sale is still active")]
    SaleStillActive,
    // Voting errors
    #[msg("Title is too long (max 200 characters)")]
    TitleTooLong,
    #[msg("Description is too long (max 1000 characters)")]
    DescriptionTooLong,
    #[msg("SVG data is too long (max 5000 characters)")]
    SvgDataTooLong,
    #[msg("SVG data cannot be empty")]
    EmptySvgData,
    #[msg("Invalid voting duration")]
    InvalidDuration,
    #[msg("Voting is disabled for this property")]
    VotingDisabled,
    #[msg("Proposal is inactive")]
    ProposalInactive,
    #[msg("Voting has ended")]
    VotingEnded,
    #[msg("You do not own this NFT")]
    NotNftOwner,
    #[msg("NFT does not belong to this property")]
    WrongProperty,
    #[msg("This NFT has no voting power")]
    NoVotingPower,
    #[msg("Voting is still active")]
    VotingStillActive,
    // Team management errors
    #[msg("Team member is not active")]
    TeamMemberInactive,
    #[msg("Unauthorized: Only admin or team members can perform this action")]
    Unauthorized,
    // Liquidation errors
    #[msg("Property has already been liquidated")]
    AlreadyLiquidated,
    #[msg("Property has not been liquidated yet")]
    NotLiquidated,
    #[msg("Not enough liquidation funds remain to honor this claim")]
    LiquidationInsufficientFunds,
}
