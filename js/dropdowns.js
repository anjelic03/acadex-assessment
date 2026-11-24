// Assessment and profile choices from StudentProfileOptions.
window.assessmentOptions = {
    "suffixes": [
        "N/A",
        "JR",
        "SR",
        "II",
        "III",
        "IV"
    ],
    "genders": [
        "Male",
        "Female"
    ],
    "civil_statuses": [
        "Single",
        "Married",
        "Widowed",
        "Separated/Annulled"
    ],
    "citizenships": [
        "Filipino",
        "Dual Citizen",
        "Foreign National"
    ],
    "strands": [
        "STEM",
        "ABM",
        "HUMSS",
        "GAS",
        "TVL"
    ],
    "enroll_decisions": [
        "Free Higher Education",
        "It is affordable",
        "It is near my home",
        "It offers my preferred program",
        "It has a good reputation",
        "It was recommended by family",
        "It was recommended by friends or teachers",
        "It matches my career goals",
        "I was encouraged by my academic strengths",
        "Not sure"
    ],
    "ambitions": [
        "To get a stable job",
        "To become a professional in my field",
        "To help my family",
        "To continue to higher studies",
        "To start a business",
        "To work abroad",
        "To serve my community",
        "To become financially independent",
        "To achieve personal growth",
        "Not sure"
    ],
    "hobbies": [
        "Reading",
        "Writing",
        "Drawing or Sketching",
        "Painting",
        "Playing Musical Instruments",
        "Singing",
        "Dancing",
        "Sports and Exercise",
        "Watching Movies or Series",
        "Gaming",
        "Cooking or Baking",
        "Gardening",
        "Photography",
        "Travel or Outdoor Activities",
        "Crafting or DIY Activities",
        "Volunteering",
        "Collecting Items",
        "Social Media Content Creation",
        "Listening to Music",
        "Meditation or Yoga"
    ],
    "interests": [
        "Coding and Programming",
        "Computer Hardware and Networking",
        "Game Development",
        "Mobile App Development",
        "Artificial Intelligence and Data Science",
        "Web Design and Development",
        "Marketing and Sales",
        "Business Management",
        "Accounting and Finance",
        "Entrepreneurship and Innovation",
        "E-commerce and Online Selling",
        "Graphic Design",
        "Animation and Multimedia",
        "Photography and Video Editing",
        "Performing Arts (Music, Dance, Theater)",
        "Creative Writing or Journalism",
        "Mathematics and Problem Solving",
        "Physics or Engineering Design",
        "Chemistry and Experiments",
        "Research and Innovation",
        "Teaching and Training Others",
        "Psychology and Human Behavior",
        "Community Service and Leadership",
        "Communication and Public Speaking",
        "Biology and Life Sciences",
        "Environmental Conservation",
        "Healthcare and Medical Fields",
        "Nutrition and Fitness"
    ],
    "strengths": [
        "Logical and Analytical Thinking",
        "Creativity and Design",
        "Problem Solving",
        "Leadership and Teamwork",
        "Communication Skills (Oral/Written)",
        "Technical Skills (Computers, Programming, etc.)",
        "Numerical and Mathematical Ability",
        "Organization and Time Management",
        "Empathy and Understanding People",
        "Adaptability and Quick Learning",
        "Attention to Detail",
        "Research and Investigation"
    ],
    "traits": [
        "tense/jittery",
        "easily troubled",
        "happy-go-lucky",
        "friendly",
        "confident",
        "responsible",
        "loner",
        "imaginative",
        "submissive",
        "relaxed/calm",
        "suspicious",
        "dominant",
        "independent",
        "dependent",
        "stubborn",
        "sentimental",
        "sensitive",
        "perceptive",
        "idealistic",
        "practical",
        "trusting",
        "insecure",
        "worrier"
    ],
    "bothers": [
        "Financial difficulty",
        "Health problems",
        "Difficulties in adjusting a new school",
        "Interpersonal relationship (parents; friends; siblings)",
        "Study habits",
        "Student-Instructor relationship",
        "Developing self-confidence"
    ],
    "education_levels": [
        "No formal schooling",
        "Elementary level",
        "Elementary graduate",
        "High school level",
        "High school graduate",
        "Senior high school",
        "Vocational/Technical",
        "College level",
        "College graduate",
        "Postgraduate"
    ],
    "occupations": [
        "Unemployed / Not Working",
        "Government Employee",
        "Private Employee",
        "Professional",
        "Skilled Worker",
        "Service & Sales Worker",
        "Agriculture / Fisheries",
        "Self-employed / Business Owner",
        "OFW"
    ],
    "family_incomes": [
        "Below 10,000",
        "10,000 - 20,000",
        "20,001 - 40,000",
        "40,001 and above"
    ],
    "program_sort": [
        {
            "value": "1-asc",
            "label": "Name A–Z"
        },
        {
            "value": "1-desc",
            "label": "Name Z–A"
        },
        {
            "value": "0-asc",
            "label": "Code A–Z"
        },
        {
            "value": "0-desc",
            "label": "Code Z–A"
        }
    ]
};

const manilaYear = Number(new Intl.DateTimeFormat("en", { timeZone: "Asia/Manila", year: "numeric" }).format(new Date()));
window.assessmentOptions.graduation_years = Array.from({ length: manilaYear - 1999 }, (_, index) => String(manilaYear - index));
