import { Request, Response } from "express";
import * as configService from "./config.service";

export async function getPublicConfig(_req: Request, res: Response) {
  try {
    const s = await configService.getPlatformSettings();
    res.json({
      config: {
        commissionRate: parseFloat(s.commission_rate),
        supportPhone: s.support_phone,
        supportEmail: s.support_email,
        supportHours: s.support_hours,
        logoUrl: s.logo_url,
        heroImageUrl: s.hero_image_url,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAdminConfig(_req: Request, res: Response) {
  try {
    const s = await configService.getPlatformSettings();
    res.json({
      config: {
        commissionRate: parseFloat(s.commission_rate),
        requireListingApproval: s.require_listing_approval,
        supportPhone: s.support_phone,
        supportEmail: s.support_email,
        supportHours: s.support_hours,
        logoUrl: s.logo_url,
        heroImageUrl: s.hero_image_url,
        updatedAt: s.updated_at,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateAdminConfig(req: Request, res: Response) {
  try {
    const { commissionRate, requireListingApproval, supportPhone, supportEmail, supportHours, logoUrl, heroImageUrl } = req.body;
    const s = await configService.updatePlatformSettings({
      commissionRate, requireListingApproval, supportPhone, supportEmail, supportHours, logoUrl, heroImageUrl,
    }, req.user!.userId);
    res.json({
      config: {
        commissionRate: parseFloat(s.commission_rate),
        requireListingApproval: s.require_listing_approval,
        supportPhone: s.support_phone,
        supportEmail: s.support_email,
        supportHours: s.support_hours,
        logoUrl: s.logo_url,
        heroImageUrl: s.hero_image_url,
        updatedAt: s.updated_at,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
