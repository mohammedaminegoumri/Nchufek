/**
 * Seed: 40 demo users around El Jadida. All share the password "nchufek123".
 * Run locally: npm run seed   ·   Against Neon: same, with DATABASE_URL set.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

const EL_JADIDA = { lat: 33.2316, lon: -8.5007 };
const CITIES = ["El Jadida", "Sidi Bouzid", "Moulay Abdellah", "Azemmour", "Haouzia"];
const MALE = ["Mohamed","Youssef","Amine","Omar","Hamza","Anas","Ayoub","Mehdi","Bilal","Zakaria","Ilyas","Soufiane","Reda","Taha","Achraf","Yassine","Adam","Karim","Walid","Nabil"];
const FEMALE = ["Salma","Imane","Aya","Kenza","Nada","Yasmine","Meryem","Douae","Hiba","Chaimae","Sara","Rim","Oumaima","Ghita","Malak","Ikram","Amal","Zineb","Fatima","Nour"];
const HOBBIES = ["football","surfing","reading","cooking","photography","gym","hiking","gaming","art","travel","volunteering","coding","music","pets"];
const MUSIC = ["rai","rap","chaabi","pop","gnawa","r&b","classical","rock","jazz"];
const MOVIES = ["drama","comedy","thriller","documentary","anime","action","romance","sci-fi"];
const TRAITS = ["funny","calm","romantic","creative","night_owl","early_bird","ambitious","adventurous"];
const QUOTES = [
  "Li fat mat — what's past is past.",
  "The sea taught me patience.",
  "Coffee first, decisions later.",
  "Kindness costs nothing.",
  "Sunsets at the Cité Portugaise > everything.",
  "Dream big, stay humble.",
];
const OCCUPATIONS = ["Teacher","Nurse","Developer","Pharmacist","Shop owner","Engineer","Student","Accountant","Designer","Photographer"];
const MBTIS = ["INFJ","ENFP","ISTJ","ESFP","INTP","ENTJ","ISFJ","ENTP"];
const ZODIACS = ["aries","taurus","gemini","cancer","leo","virgo","libra","scorpio","sagittarius","capricorn","aquarius","pisces"];

const rand = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const sample = <T,>(a: T[], n: number): T[] => [...a].sort(() => 0.5 - Math.random()).slice(0, n);
const between = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

async function main() {
  console.log("Seeding NCHUFEK? demo data…");
  const passwordHash = await bcrypt.hash("nchufek123", 10);

  for (let i = 0; i < 40; i++) {
    const gender = i % 2 === 0 ? "MALE" : "FEMALE";
    const name = gender === "MALE" ? MALE[i / 2] : FEMALE[(i - 1) / 2];
    const age = between(19, 34);
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - age);
    const lat = EL_JADIDA.lat + (Math.random() - 0.5) * 0.25;
    const lon = EL_JADIDA.lon + (Math.random() - 0.5) * 0.25;
    const email = `${name.toLowerCase().replace(/\s/g, "")}${i}@demo.nchufek.local`;

    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email, passwordHash,
        firstName: name, birthDate,
        gender: gender as any,
        lookingFor: gender === "MALE" ? "FEMALE" : "MALE",
        goals: sample(["FRIENDSHIP","DATING","LONG_TERM","MARRIAGE"] as any[], between(1, 2)),
        latitude: Math.round(lat * 100) / 100,
        longitude: Math.round(lon * 100) / 100,
        city: rand(CITIES),
        searchRadiusKm: rand([20, 30, 50]),
        lastSeenAt: new Date(Date.now() - between(0, 72) * 3600_000),
        profile: {
          create: {
            favoriteQuote: rand(QUOTES),
            heightCm: gender === "MALE" ? between(165, 192) : between(152, 178),
            languages: sample(["darija","arabic","french","english","spanish"], between(2, 4)),
            religion: rand(["Muslim","Muslim","Muslim","Prefer not to say"]),
            smoking: rand(["NEVER","NEVER","SOCIALLY","OFTEN"] as any[]),
            drinking: rand(["NEVER","NEVER","SOCIALLY"] as any[]),
            occupation: rand(OCCUPATIONS),
            education: rand(["BAC","LICENCE","LICENCE","MASTER"] as any[]),
            hobbies: sample(HOBBIES, between(3, 6)),
            music: sample(MUSIC, between(2, 4)),
            movies: sample(MOVIES, between(2, 3)),
            personality: rand(["INTROVERT","EXTROVERT","AMBIVERT"] as any[]),
            traits: sample(TRAITS, between(2, 4)),
            mbti: rand(MBTIS),
            zodiac: rand(ZODIACS),
            children: rand(["WANT","OPEN","PREFER_NOT_SAY"] as any[]),
          },
        },
        preferences: { create: { ageMin: Math.max(18, age - 6), ageMax: age + 8 } },
      },
    });
  }
  console.log("Done: 40 demo users. Any can log in with password nchufek123.");
}

main().finally(() => prisma.$disconnect());
