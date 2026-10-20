import { HRContact } from '../models/HRContact.js';
import { Campaign } from '../models/Campaign.js';
import { OutreachLog } from '../models/OutreachLog.js';

// @route   GET /api/hr-contacts
export const getContacts = async (req, res) => {
  try {
    const { search, techStack, location, industry, tier, page = 1, limit = 100 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { recruiterName: { $regex: search, $options: 'i' } },
        { recruiterTitle: { $regex: search, $options: 'i' } },
        { techStack: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    if (techStack) {
      const stacks = techStack.split(',').map((s) => s.trim());
      query.techStack = { $in: stacks.map((s) => new RegExp(s, 'i')) };
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (industry) {
      query.industry = { $regex: industry, $options: 'i' };
    }

    if (tier && tier !== 'all') {
      if (tier === 'remote') {
        query.location = { $regex: 'remote', $options: 'i' };
      } else if (tier === 'big_tech') {
        query.$or = [
          { tier: 'big_tech' },
          { companyName: { $regex: 'Google|Microsoft|Amazon|Meta|Apple|Netflix|Oracle|Adobe|Cisco|IBM|Salesforce|Uber', $options: 'i' } },
        ];
      } else if (tier === 'unicorn') {
        query.$or = [
          { tier: 'unicorn' },
          { companyName: { $regex: 'Stripe|Swiggy|Zomato|Razorpay|Zepto|Cred|Coinbase|Airbnb|Paytm|Ola|Flipkart|Postman|Groww|BrowserStack', $options: 'i' } },
        ];
      } else if (tier === 'fintech') {
        query.$or = [
          { tier: 'fintech' },
          { industry: { $regex: 'Fintech|Banking|Payments|Wealthtech|Financial', $options: 'i' } },
          { companyName: { $regex: 'Razorpay|Groww|Cred|Zerodha|Paytm|Stripe|PayPal|Block|Plaid|PhonePe|Coinbase', $options: 'i' } },
        ];
      } else if (tier === 'startup') {
        query.$or = [
          { tier: 'startup' },
          { companySize: { $in: ['1-10', '11-50', '50-200'] } },
          { industry: { $regex: 'Startup|SaaS|AI|Early|Developer Tools', $options: 'i' } },
        ];
      } else {
        query.tier = tier;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await HRContact.countDocuments(query);
    const contacts = await HRContact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: contacts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/hr-contacts/tech-stacks
export const getTechStacks = async (req, res) => {
  try {
    const stacks = await HRContact.distinct('techStack');
    res.json({ success: true, data: stacks.filter(Boolean).sort() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/hr-contacts
export const createContact = async (req, res) => {
  try {
    const { companyName, recruiterName, recruiterEmail, techStack, recruiterTitle, website, location, industry } = req.body;

    if (!companyName || !recruiterName || !recruiterEmail) {
      return res.status(400).json({ success: false, message: 'Company, recruiter name, and email are required' });
    }

    const contact = await HRContact.create({
      companyName,
      recruiterName,
      recruiterEmail,
      techStack: Array.isArray(techStack) ? techStack : (techStack || '').split(',').map((s) => s.trim()),
      recruiterTitle: recruiterTitle || 'Technical Recruiter',
      website,
      location,
      industry,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/hr-contacts/bulk
export const bulkCreate = async (req, res) => {
  try {
    const { contacts } = req.body;
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of contacts' });
    }

    const formatted = contacts.map((c) => ({
      ...c,
      techStack: Array.isArray(c.techStack) ? c.techStack : (c.techStack || '').split(',').map((s) => s.trim()),
      createdBy: req.user._id,
    }));

    const inserted = await HRContact.insertMany(formatted, { ordered: false });
    res.status(201).json({ success: true, count: inserted.length, data: inserted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PUT /api/hr-contacts/:id
export const updateContact = async (req, res) => {
  try {
    const { companyName, recruiterName, recruiterEmail, techStack, recruiterTitle, website, location, industry } = req.body;

    const contact = await HRContact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'HR contact not found' });
    }

    if (companyName) contact.companyName = companyName.trim();
    if (recruiterName) contact.recruiterName = recruiterName.trim();
    if (recruiterEmail) contact.recruiterEmail = recruiterEmail.trim().toLowerCase();
    if (recruiterTitle !== undefined) contact.recruiterTitle = recruiterTitle.trim();
    if (techStack !== undefined) {
      contact.techStack = Array.isArray(techStack) ? techStack : (techStack || '').split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (website !== undefined) contact.website = website.trim();
    if (location !== undefined) contact.location = location.trim();
    if (industry !== undefined) contact.industry = industry.trim();

    await contact.save();
    res.json({ success: true, message: 'Contact updated successfully', data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   DELETE /api/hr-contacts/:id
export const deleteContact = async (req, res) => {
  try {
    const contact = await HRContact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'HR contact not found' });
    }

    // Cascade: Permanently remove this HR contact from all campaigns and delete associated outreach logs
    await Campaign.updateMany(
      { targetContacts: req.params.id },
      { $pull: { targetContacts: req.params.id } }
    );
    await OutreachLog.deleteMany({ hrContactId: req.params.id });

    res.json({ success: true, message: 'Contact permanently deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/hr-contacts/bulk-delete
export const bulkDeleteContacts = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of contact IDs to delete' });
    }

    const result = await HRContact.deleteMany({ _id: { $in: ids } });

    // Cascade: Permanently remove all selected HR contacts from campaigns and delete associated outreach logs
    await Campaign.updateMany(
      { targetContacts: { $in: ids } },
      { $pull: { targetContacts: { $in: ids } } }
    );
    await OutreachLog.deleteMany({ hrContactId: { $in: ids } });

    res.json({
      success: true,
      message: `${result.deletedCount} contacts permanently deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
