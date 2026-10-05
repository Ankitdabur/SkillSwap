import mongoose from "mongoose";

import {dbconnect} from "../db/index.js";
import Skill from "../models/skill.model.js";
import { SKILL_CATEGORIES } from "../constants/enums.js";

const predefinedSkills = [
  // ==================================================
  // TECHNOLOGY & PROGRAMMING
  // ==================================================
  {
    name: "javascript",
    displayName: "JavaScript",
    category: SKILL_CATEGORIES.TECHNOLOGY_PROGRAMMING,
    description: "Learn JavaScript for web development and programming.",
  },
  {
    name: "python",
    displayName: "Python",
    category: SKILL_CATEGORIES.TECHNOLOGY_PROGRAMMING,
    description: "Learn Python programming from fundamentals to practical applications.",
  },
  {
    name: "java",
    displayName: "Java",
    category: SKILL_CATEGORIES.TECHNOLOGY_PROGRAMMING,
    description: "Learn Java programming and object-oriented development.",
  },
  {
    name: "c++",
    displayName: "C++",
    category: SKILL_CATEGORIES.TECHNOLOGY_PROGRAMMING,
    description: "Learn C++ programming, problem solving, and core concepts.",
  },
  {
    name: "node.js",
    displayName: "Node.js",
    category: SKILL_CATEGORIES.TECHNOLOGY_PROGRAMMING,
    description: "Learn backend development using Node.js.",
  },
  {
    name: "react",
    displayName: "React",
    category: SKILL_CATEGORIES.TECHNOLOGY_PROGRAMMING,
    description: "Learn how to build modern user interfaces with React.",
  },

  // ==================================================
  // DESIGN & CREATIVE
  // ==================================================
  {
    name: "figma",
    displayName: "Figma",
    category: SKILL_CATEGORIES.DESIGN_CREATIVE,
    description: "Learn interface design and prototyping using Figma.",
  },
  {
    name: "ui/ux design",
    displayName: "UI/UX Design",
    category: SKILL_CATEGORIES.DESIGN_CREATIVE,
    description: "Learn user interface and user experience design principles.",
  },
  {
    name: "graphic design",
    displayName: "Graphic Design",
    category: SKILL_CATEGORIES.DESIGN_CREATIVE,
    description: "Learn visual design principles and graphic design techniques.",
  },
  {
    name: "adobe photoshop",
    displayName: "Adobe Photoshop",
    category: SKILL_CATEGORIES.DESIGN_CREATIVE,
    description: "Learn image editing and graphic creation using Adobe Photoshop.",
  },

  // ==================================================
  // BUSINESS & ENTREPRENEURSHIP
  // ==================================================
  {
    name: "entrepreneurship",
    displayName: "Entrepreneurship",
    category: SKILL_CATEGORIES.BUSINESS_ENTREPRENEURSHIP,
    description: "Learn the fundamentals of starting and growing a business.",
  },
  {
    name: "business strategy",
    displayName: "Business Strategy",
    category: SKILL_CATEGORIES.BUSINESS_ENTREPRENEURSHIP,
    description: "Learn how to plan and evaluate business strategies.",
  },
  {
    name: "startup planning",
    displayName: "Startup Planning",
    category: SKILL_CATEGORIES.BUSINESS_ENTREPRENEURSHIP,
    description: "Learn how to develop and validate a startup idea.",
  },
  {
    name: "product management",
    displayName: "Product Management",
    category: SKILL_CATEGORIES.BUSINESS_ENTREPRENEURSHIP,
    description: "Learn product planning, prioritization, and development fundamentals.",
  },

  // ==================================================
  // MARKETING & SALES
  // ==================================================
  {
    name: "digital marketing",
    displayName: "Digital Marketing",
    category: SKILL_CATEGORIES.MARKETING_SALES,
    description: "Learn digital channels and strategies used to market products and services.",
  },
  {
    name: "seo",
    displayName: "SEO",
    category: SKILL_CATEGORIES.MARKETING_SALES,
    description: "Learn search engine optimization fundamentals and techniques.",
  },
  {
    name: "social media marketing",
    displayName: "Social Media Marketing",
    category: SKILL_CATEGORIES.MARKETING_SALES,
    description: "Learn how to market brands using social media platforms.",
  },
  {
    name: "sales",
    displayName: "Sales",
    category: SKILL_CATEGORIES.MARKETING_SALES,
    description: "Learn sales communication, customer handling, and closing techniques.",
  },

  // ==================================================
  // FINANCE & ACCOUNTING
  // ==================================================
  {
    name: "personal finance",
    displayName: "Personal Finance",
    category: SKILL_CATEGORIES.FINANCE_ACCOUNTING,
    description: "Learn budgeting, saving, investing, and personal money management.",
  },
  {
    name: "accounting",
    displayName: "Accounting",
    category: SKILL_CATEGORIES.FINANCE_ACCOUNTING,
    description: "Learn fundamental accounting concepts and practices.",
  },
  {
    name: "financial analysis",
    displayName: "Financial Analysis",
    category: SKILL_CATEGORIES.FINANCE_ACCOUNTING,
    description: "Learn how to understand and analyze financial information.",
  },
  {
    name: "excel for finance",
    displayName: "Excel for Finance",
    category: SKILL_CATEGORIES.FINANCE_ACCOUNTING,
    description: "Learn how to use Excel for financial calculations and analysis.",
  },

  // ==================================================
  // LANGUAGES
  // ==================================================
  {
    name: "english",
    displayName: "English",
    category: SKILL_CATEGORIES.LANGUAGES,
    description: "Learn English speaking, reading, writing, and communication.",
  },
  {
    name: "hindi",
    displayName: "Hindi",
    category: SKILL_CATEGORIES.LANGUAGES,
    description: "Learn Hindi speaking, reading, and writing.",
  },
  {
    name: "spanish",
    displayName: "Spanish",
    category: SKILL_CATEGORIES.LANGUAGES,
    description: "Learn Spanish vocabulary, grammar, and conversation.",
  },
  {
    name: "french",
    displayName: "French",
    category: SKILL_CATEGORIES.LANGUAGES,
    description: "Learn French vocabulary, grammar, and conversation.",
  },

  // ==================================================
  // ACADEMIC TUTORING
  // ==================================================
  {
    name: "mathematics",
    displayName: "Mathematics",
    category: SKILL_CATEGORIES.ACADEMIC_TUTORING,
    description: "Learn mathematics through concepts, examples, and problem solving.",
  },
  {
    name: "economics",
    displayName: "Economics",
    category: SKILL_CATEGORIES.ACADEMIC_TUTORING,
    description: "Learn fundamental concepts of economics.",
  },
  {
    name: "history",
    displayName: "History",
    category: SKILL_CATEGORIES.ACADEMIC_TUTORING,
    description: "Learn historical topics with structured academic guidance.",
  },
  {
    name: "computer science",
    displayName: "Computer Science",
    category: SKILL_CATEGORIES.ACADEMIC_TUTORING,
    description: "Learn academic computer science concepts and fundamentals.",
  },

  // ==================================================
  // SCIENCE & ENGINEERING
  // ==================================================
  {
    name: "physics",
    displayName: "Physics",
    category: SKILL_CATEGORIES.SCIENCE_ENGINEERING,
    description: "Learn physics concepts and problem-solving techniques.",
  },
  {
    name: "chemistry",
    displayName: "Chemistry",
    category: SKILL_CATEGORIES.SCIENCE_ENGINEERING,
    description: "Learn chemistry concepts, reactions, and fundamentals.",
  },
  {
    name: "electronics",
    displayName: "Electronics",
    category: SKILL_CATEGORIES.SCIENCE_ENGINEERING,
    description: "Learn electronic components, circuits, and basic electronics.",
  },
  {
    name: "mechanical engineering",
    displayName: "Mechanical Engineering",
    category: SKILL_CATEGORIES.SCIENCE_ENGINEERING,
    description: "Learn fundamental mechanical engineering concepts.",
  },

  // ==================================================
  // WRITING & COMMUNICATION
  // ==================================================
  {
    name: "content writing",
    displayName: "Content Writing",
    category: SKILL_CATEGORIES.WRITING_COMMUNICATION,
    description: "Learn how to create clear and engaging written content.",
  },
  {
    name: "creative writing",
    displayName: "Creative Writing",
    category: SKILL_CATEGORIES.WRITING_COMMUNICATION,
    description: "Learn storytelling and creative writing techniques.",
  },
  {
    name: "public speaking",
    displayName: "Public Speaking",
    category: SKILL_CATEGORIES.WRITING_COMMUNICATION,
    description: "Learn how to communicate confidently in front of an audience.",
  },
  {
    name: "presentation skills",
    displayName: "Presentation Skills",
    category: SKILL_CATEGORIES.WRITING_COMMUNICATION,
    description: "Learn how to prepare and deliver effective presentations.",
  },

  // ==================================================
  // MUSIC & AUDIO
  // ==================================================
  {
    name: "guitar",
    displayName: "Guitar",
    category: SKILL_CATEGORIES.MUSIC_AUDIO,
    description: "Learn guitar chords, techniques, and songs.",
  },
  {
    name: "piano",
    displayName: "Piano",
    category: SKILL_CATEGORIES.MUSIC_AUDIO,
    description: "Learn piano fundamentals, chords, and songs.",
  },
  {
    name: "singing",
    displayName: "Singing",
    category: SKILL_CATEGORIES.MUSIC_AUDIO,
    description: "Learn vocal techniques, pitch, and singing fundamentals.",
  },
  {
    name: "music production",
    displayName: "Music Production",
    category: SKILL_CATEGORIES.MUSIC_AUDIO,
    description: "Learn the fundamentals of recording and producing music.",
  },

  // ==================================================
  // PHOTOGRAPHY & VIDEO
  // ==================================================
  {
    name: "photography",
    displayName: "Photography",
    category: SKILL_CATEGORIES.PHOTOGRAPHY_VIDEO,
    description: "Learn photography fundamentals, composition, and camera techniques.",
  },
  {
    name: "video editing",
    displayName: "Video Editing",
    category: SKILL_CATEGORIES.PHOTOGRAPHY_VIDEO,
    description: "Learn how to edit and produce engaging videos.",
  },
  {
    name: "cinematography",
    displayName: "Cinematography",
    category: SKILL_CATEGORIES.PHOTOGRAPHY_VIDEO,
    description: "Learn camera composition, lighting, and visual storytelling.",
  },
  {
    name: "adobe premiere pro",
    displayName: "Adobe Premiere Pro",
    category: SKILL_CATEGORIES.PHOTOGRAPHY_VIDEO,
    description: "Learn professional video editing using Adobe Premiere Pro.",
  },

  // ==================================================
  // ART & CRAFTS
  // ==================================================
  {
    name: "drawing",
    displayName: "Drawing",
    category: SKILL_CATEGORIES.ART_CRAFTS,
    description: "Learn drawing techniques and visual fundamentals.",
  },
  {
    name: "painting",
    displayName: "Painting",
    category: SKILL_CATEGORIES.ART_CRAFTS,
    description: "Learn painting techniques and creative expression.",
  },
  {
    name: "sketching",
    displayName: "Sketching",
    category: SKILL_CATEGORIES.ART_CRAFTS,
    description: "Learn sketching techniques using traditional drawing methods.",
  },
  {
    name: "crochet",
    displayName: "Crochet",
    category: SKILL_CATEGORIES.ART_CRAFTS,
    description: "Learn crochet stitches, patterns, and handmade projects.",
  },

  // ==================================================
  // DANCE & PERFORMING ARTS
  // ==================================================
  {
    name: "hip hop dance",
    displayName: "Hip Hop Dance",
    category: SKILL_CATEGORIES.DANCE_PERFORMING_ARTS,
    description: "Learn hip hop dance movements and routines.",
  },
  {
    name: "contemporary dance",
    displayName: "Contemporary Dance",
    category: SKILL_CATEGORIES.DANCE_PERFORMING_ARTS,
    description: "Learn contemporary dance techniques and movement.",
  },
  {
    name: "classical dance",
    displayName: "Classical Dance",
    category: SKILL_CATEGORIES.DANCE_PERFORMING_ARTS,
    description: "Learn classical dance fundamentals and techniques.",
  },
  {
    name: "acting",
    displayName: "Acting",
    category: SKILL_CATEGORIES.DANCE_PERFORMING_ARTS,
    description: "Learn acting techniques, expression, and performance skills.",
  },

  // ==================================================
  // HEALTH & FITNESS
  // ==================================================
  {
    name: "yoga",
    displayName: "Yoga",
    category: SKILL_CATEGORIES.HEALTH_FITNESS,
    description: "Learn yoga poses, flexibility, and breathing techniques.",
  },
  {
    name: "strength training",
    displayName: "Strength Training",
    category: SKILL_CATEGORIES.HEALTH_FITNESS,
    description: "Learn strength-training techniques and workout fundamentals.",
  },
  {
    name: "nutrition basics",
    displayName: "Nutrition Basics",
    category: SKILL_CATEGORIES.HEALTH_FITNESS,
    description: "Learn general nutrition fundamentals and healthy eating concepts.",
  },
  {
    name: "meditation",
    displayName: "Meditation",
    category: SKILL_CATEGORIES.HEALTH_FITNESS,
    description: "Learn basic meditation and mindfulness techniques.",
  },

  // ==================================================
  // SPORTS
  // ==================================================
  {
    name: "cricket",
    displayName: "Cricket",
    category: SKILL_CATEGORIES.SPORTS,
    description: "Learn cricket fundamentals, techniques, and game skills.",
  },
  {
    name: "football",
    displayName: "Football",
    category: SKILL_CATEGORIES.SPORTS,
    description: "Learn football fundamentals and playing techniques.",
  },
  {
    name: "badminton",
    displayName: "Badminton",
    category: SKILL_CATEGORIES.SPORTS,
    description: "Learn badminton techniques, movement, and gameplay.",
  },
  {
    name: "basketball",
    displayName: "Basketball",
    category: SKILL_CATEGORIES.SPORTS,
    description: "Learn basketball fundamentals, drills, and gameplay.",
  },

  // ==================================================
  // COOKING & FOOD
  // ==================================================
  {
    name: "indian cooking",
    displayName: "Indian Cooking",
    category: SKILL_CATEGORIES.COOKING_FOOD,
    description: "Learn how to prepare popular Indian dishes and recipes.",
  },
  {
    name: "baking",
    displayName: "Baking",
    category: SKILL_CATEGORIES.COOKING_FOOD,
    description: "Learn baking techniques for cakes, breads, and desserts.",
  },
  {
    name: "vegetarian cooking",
    displayName: "Vegetarian Cooking",
    category: SKILL_CATEGORIES.COOKING_FOOD,
    description: "Learn how to prepare a variety of vegetarian meals.",
  },
  {
    name: "meal preparation",
    displayName: "Meal Preparation",
    category: SKILL_CATEGORIES.COOKING_FOOD,
    description: "Learn practical meal planning and preparation techniques.",
  },

  // ==================================================
  // CAREER & PROFESSIONAL
  // ==================================================
  {
    name: "resume writing",
    displayName: "Resume Writing",
    category: SKILL_CATEGORIES.CAREER_PROFESSIONAL,
    description: "Learn how to create a clear and effective professional resume.",
  },
  {
    name: "interview preparation",
    displayName: "Interview Preparation",
    category: SKILL_CATEGORIES.CAREER_PROFESSIONAL,
    description: "Learn how to prepare for professional interviews.",
  },
  {
    name: "linkedin profile optimization",
    displayName: "LinkedIn Profile Optimization",
    category: SKILL_CATEGORIES.CAREER_PROFESSIONAL,
    description: "Learn how to improve a LinkedIn profile for professional opportunities.",
  },
  {
    name: "job search strategy",
    displayName: "Job Search Strategy",
    category: SKILL_CATEGORIES.CAREER_PROFESSIONAL,
    description: "Learn practical techniques for finding and applying for jobs.",
  },

  // ==================================================
  // PERSONAL DEVELOPMENT
  // ==================================================
  {
    name: "time management",
    displayName: "Time Management",
    category: SKILL_CATEGORIES.PERSONAL_DEVELOPMENT,
    description: "Learn techniques for organizing time and priorities.",
  },
  {
    name: "goal setting",
    displayName: "Goal Setting",
    category: SKILL_CATEGORIES.PERSONAL_DEVELOPMENT,
    description: "Learn how to define and work toward achievable goals.",
  },
  {
    name: "productivity",
    displayName: "Productivity",
    category: SKILL_CATEGORIES.PERSONAL_DEVELOPMENT,
    description: "Learn practical techniques for improving productivity.",
  },
  {
    name: "confidence building",
    displayName: "Confidence Building",
    category: SKILL_CATEGORIES.PERSONAL_DEVELOPMENT,
    description: "Learn practical techniques for developing personal confidence.",
  },

  // ==================================================
  // TRADES & DIY
  // ==================================================
  {
    name: "woodworking",
    displayName: "Woodworking",
    category: SKILL_CATEGORIES.TRADES_DIY,
    description: "Learn basic woodworking tools, techniques, and projects.",
  },
  {
    name: "basic electrical repair",
    displayName: "Basic Electrical Repair",
    category: SKILL_CATEGORIES.TRADES_DIY,
    description: "Learn basic household electrical concepts and safe repair fundamentals.",
  },
  {
    name: "plumbing basics",
    displayName: "Plumbing Basics",
    category: SKILL_CATEGORIES.TRADES_DIY,
    description: "Learn basic household plumbing concepts and maintenance.",
  },
  {
    name: "home repair",
    displayName: "Home Repair",
    category: SKILL_CATEGORIES.TRADES_DIY,
    description: "Learn common household maintenance and repair techniques.",
  },

  // ==================================================
  // FASHION & BEAUTY
  // ==================================================
  {
    name: "makeup",
    displayName: "Makeup",
    category: SKILL_CATEGORIES.FASHION_BEAUTY,
    description: "Learn makeup techniques and application fundamentals.",
  },
  {
    name: "skincare",
    displayName: "Skincare",
    category: SKILL_CATEGORIES.FASHION_BEAUTY,
    description: "Learn general skincare routines and product fundamentals.",
  },
  {
    name: "fashion styling",
    displayName: "Fashion Styling",
    category: SKILL_CATEGORIES.FASHION_BEAUTY,
    description: "Learn clothing coordination and personal styling fundamentals.",
  },
  {
    name: "sewing",
    displayName: "Sewing",
    category: SKILL_CATEGORIES.FASHION_BEAUTY,
    description: "Learn basic sewing techniques and garment construction.",
  },

  // ==================================================
  // GAMING & ESPORTS
  // ==================================================
  {
    name: "valorant",
    displayName: "Valorant",
    category: SKILL_CATEGORIES.GAMING_ESPORTS,
    description: "Learn gameplay fundamentals, strategy, and teamwork in Valorant.",
  },
  {
    name: "counter-strike 2",
    displayName: "Counter-Strike 2",
    category: SKILL_CATEGORIES.GAMING_ESPORTS,
    description: "Learn gameplay fundamentals and team strategy in Counter-Strike 2.",
  },
  {
    name: "league of legends",
    displayName: "League of Legends",
    category: SKILL_CATEGORIES.GAMING_ESPORTS,
    description: "Learn gameplay fundamentals, roles, and strategy in League of Legends.",
  },
  {
    name: "minecraft",
    displayName: "Minecraft",
    category: SKILL_CATEGORIES.GAMING_ESPORTS,
    description: "Learn building, survival, and gameplay techniques in Minecraft.",
  },

  // ==================================================
  // DATA & ANALYTICS
  // ==================================================
  {
    name: "microsoft excel",
    displayName: "Microsoft Excel",
    category: SKILL_CATEGORIES.DATA_ANALYTICS,
    description: "Learn spreadsheets, formulas, data organization, and analysis using Excel.",
  },
  {
    name: "sql",
    displayName: "SQL",
    category: SKILL_CATEGORIES.DATA_ANALYTICS,
    description: "Learn how to query and work with relational databases using SQL.",
  },
  {
    name: "power bi",
    displayName: "Power BI",
    category: SKILL_CATEGORIES.DATA_ANALYTICS,
    description: "Learn data visualization and dashboard creation using Power BI.",
  },
  {
    name: "tableau",
    displayName: "Tableau",
    category: SKILL_CATEGORIES.DATA_ANALYTICS,
    description: "Learn data visualization and dashboard creation using Tableau.",
  },
  {
    name: "data analysis",
    displayName: "Data Analysis",
    category: SKILL_CATEGORIES.DATA_ANALYTICS,
    description: "Learn how to clean, analyze, and interpret data.",
  },

  // ==================================================
  // LAW & LEGAL
  // ==================================================
  {
    name: "legal research",
    displayName: "Legal Research",
    category: SKILL_CATEGORIES.LAW_LEGAL,
    description: "Learn fundamental legal research methods and techniques.",
  },
  {
    name: "contract basics",
    displayName: "Contract Basics",
    category: SKILL_CATEGORIES.LAW_LEGAL,
    description: "Learn general concepts used in understanding contracts.",
  },
  {
    name: "intellectual property basics",
    displayName: "Intellectual Property Basics",
    category: SKILL_CATEGORIES.LAW_LEGAL,
    description: "Learn introductory concepts related to intellectual property.",
  },
  {
    name: "corporate law basics",
    displayName: "Corporate Law Basics",
    category: SKILL_CATEGORIES.LAW_LEGAL,
    description: "Learn introductory concepts related to corporate law.",
  },

  // ==================================================
  // OTHER
  // ==================================================
  {
    name: "gardening",
    displayName: "Gardening",
    category: SKILL_CATEGORIES.OTHER,
    description: "Learn basic gardening, plant care, and maintenance.",
  },
  {
    name: "event planning",
    displayName: "Event Planning",
    category: SKILL_CATEGORIES.OTHER,
    description: "Learn how to organize and coordinate events.",
  },
  {
    name: "pet care",
    displayName: "Pet Care",
    category: SKILL_CATEGORIES.OTHER,
    description: "Learn general pet-care routines and responsibilities.",
  },
  {
    name: "chess",
    displayName: "Chess",
    category: SKILL_CATEGORIES.OTHER,
    description: "Learn chess rules, tactics, strategy, and game analysis.",
  },
];

const seedSkills = async () => {
  try {
    await dbconnect();

    console.log("Database connected. Starting Skill seed...");

    for (const skill of predefinedSkills) {
      await Skill.updateOne(
        {
          name: skill.name,
        },
        {
          $set: {
            displayName: skill.displayName,
            category: skill.category,
            description: skill.description,
          },
        },
        {
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      );
    }

    console.log(
      `${predefinedSkills.length} predefined Skills seeded successfully.`,
    );
  } catch (error) {
    console.error("Skill seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Database disconnected.");
  }
};

seedSkills();