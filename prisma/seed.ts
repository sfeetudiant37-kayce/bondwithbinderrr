import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const skills = [
  'Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Welding',
  'Tiling', 'Masonry', 'Roofing', 'HVAC', 'Landscaping',
  'Cleaning', 'Moving', 'Tailoring', 'Catering', 'Photography',
  'Web Design', 'Accounting', 'Translation', 'Tutoring', 'Driving'
];

const locations = ['Douala', 'Yaoundé', 'Buea', 'Bamenda', 'Bafoussam', 'Garoua'];

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('Starting seed...');

  // Clean existing data
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.review.deleteMany();
  await prisma.match.deleteMany();
  await prisma.swipe.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.weightConfig.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hashPassword('password123');

  // Create SCENARIO 1: Marie Kamdem - Client seeking plumber
  const marie = await prisma.user.create({
    data: {
      email: 'marie@binder.cm',
      name: 'Marie Kamdem',
      password: passwordHash,
      phone: '+237 691 234 567',
      location: 'Douala',
      language: 'fr',
      activeRole: 'client',
      profileCompletion: 75,
      profile: {
        create: {
          photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
          bio: 'Homeowner looking for reliable service providers in Douala',
          preferences: JSON.stringify(['Plumbing', 'Electrical', 'Cleaning']),
          objective: 'find_service',
          skills: '[]',
        }
      },
      weights: {
        create: {
          preferences: 0.25,
          location: 0.20,
          price: 0.15,
          rating: 0.15,
          availability: 0.10,
          profileCompleteness: 0.05,
          experience: 0.10,
        }
      }
    }
  });

  // SCENARIO 2: Paul Ekwalla - Provider offering services
  const paul = await prisma.user.create({
    data: {
      email: 'paul@binder.cm',
      name: 'Paul Ekwalla',
      password: passwordHash,
      phone: '+237 677 890 123',
      location: 'Douala',
      language: 'en',
      activeRole: 'provider',
      profileCompletion: 95,
      profile: {
        create: {
          photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
          bio: 'Professional plumber and welder with 8 years experience. Available for residential and commercial projects.',
          price: 15000,
          availability: 'immediate',
          experience: 8,
          rating: 4.8,
          reviewCount: 47,
          skills: JSON.stringify(['Plumbing', 'Welding', 'Tiling', 'Masonry']),
          preferences: JSON.stringify([]),
          objective: 'offer_service',
        }
      },
      weights: {
        create: {
          preferences: 0.20,
          location: 0.15,
          price: 0.15,
          rating: 0.15,
          availability: 0.15,
          profileCompleteness: 0.10,
          experience: 0.10,
        }
      }
    }
  });

  // SCENARIO 3: Jean-Pierre Mbarga - Dual-role user
  const jp = await prisma.user.create({
    data: {
      email: 'jp@binder.cm',
      name: 'Jean-Pierre Mbarga',
      password: passwordHash,
      phone: '+237 699 567 890',
      location: 'Yaoundé',
      language: 'fr',
      activeRole: 'provider',
      profileCompletion: 85,
      profile: {
        create: {
          photoUrl: 'https://images.unsplash.com/photo-1472099625465-1123bb95e5a1?w=200',
          bio: 'Electrician by day, homeowner looking for help on weekends',
          price: 25000,
          availability: 'this_week',
          experience: 5,
          rating: 4.5,
          reviewCount: 23,
          skills: JSON.stringify(['Electrical', 'Welding', 'Painting']),
          preferences: JSON.stringify(['Plumbing', 'Carpentry']),
          objective: 'both',
        }
      },
      weights: {
        create: {
          preferences: 0.20,
          location: 0.15,
          price: 0.20,
          rating: 0.15,
          availability: 0.10,
          profileCompleteness: 0.10,
          experience: 0.10,
        }
      }
    }
  });

  // SCENARIO 4: Sarah Ndongo - New user
  const sarah = await prisma.user.create({
    data: {
      email: 'sarah@binder.cm',
      name: 'Sarah Ndongo',
      password: passwordHash,
      phone: null,
      location: 'Buea',
      language: 'en',
      activeRole: 'client',
      profileCompletion: 30,
      profile: {
        create: {
          photoUrl: null,
          bio: null,
          price: null,
          availability: 'flexible',
          experience: 0,
          rating: 0,
          reviewCount: 0,
          skills: '[]',
          preferences: JSON.stringify(['Cleaning', 'Catering', 'Tailoring']),
          objective: 'find_service',
        }
      },
      weights: {
        create: {}
      }
    }
  });

  // Additional providers
  const additionalProviders = await Promise.all([
    prisma.user.create({
      data: {
        email: 'grace@binder.cm',
        name: 'Grace Nkam',
        password: passwordHash,
        phone: '+237 655 111 222',
        location: 'Douala',
        language: 'en',
        activeRole: 'provider',
        profileCompletion: 90,
        profile: {
          create: {
            photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
            bio: 'Professional cleaner and organizer. Specializing in deep cleaning and office spaces.',
            price: 8000,
            availability: 'immediate',
            experience: 4,
            rating: 4.9,
            reviewCount: 31,
            skills: JSON.stringify(['Cleaning', 'Moving', 'Landscaping']),
            preferences: JSON.stringify([]),
            objective: 'offer_service',
          }
        },
        weights: { create: {} }
      }
    }),
    prisma.user.create({
      data: {
        email: 'alain@binder.cm',
        name: 'Alain Fotso',
        password: passwordHash,
        phone: '+237 622 333 444',
        location: 'Douala',
        language: 'fr',
        activeRole: 'provider',
        profileCompletion: 80,
        profile: {
          create: {
            photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
            bio: 'Experienced carpenter and furniture maker. Custom designs available.',
            price: 20000,
            availability: 'this_week',
            experience: 12,
            rating: 4.7,
            reviewCount: 56,
            skills: JSON.stringify(['Carpentry', 'Painting', 'Roofing']),
            preferences: JSON.stringify([]),
            objective: 'offer_service',
          }
        },
        weights: { create: {} }
      }
    }),
    prisma.user.create({
      data: {
        email: 'nadia@binder.cm',
        name: 'Nadia Menga',
        password: passwordHash,
        phone: '+237 688 555 666',
        location: 'Yaoundé',
        language: 'fr',
        activeRole: 'provider',
        profileCompletion: 70,
        profile: {
          create: {
            photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
            bio: 'Tailor and fashion designer. Traditional and modern styles.',
            price: 12000,
            availability: 'flexible',
            experience: 6,
            rating: 4.6,
            reviewCount: 18,
            skills: JSON.stringify(['Tailoring', 'Photography']),
            preferences: JSON.stringify([]),
            objective: 'offer_service',
          }
        },
        weights: { create: {} }
      }
    }),
    prisma.user.create({
      data: {
        email: 'emmanuel@binder.cm',
        name: 'Emmanuel Tchoua',
        password: passwordHash,
        phone: '+237 611 777 888',
        location: 'Bamenda',
        language: 'en',
        activeRole: 'provider',
        profileCompletion: 65,
        profile: {
          create: {
            photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf99f54?w=200',
            bio: 'Web developer and graphic designer. Building your online presence.',
            price: 50000,
            availability: 'immediate',
            experience: 5,
            rating: 4.9,
            reviewCount: 42,
            skills: JSON.stringify(['Web Design', 'Photography']),
            preferences: JSON.stringify([]),
            objective: 'offer_service',
          }
        },
        weights: { create: {} }
      }
    }),
    prisma.user.create({
      data: {
        email: 'madeleine@binder.cm',
        name: 'Madeleine Siewe',
        password: passwordHash,
        phone: '+237 633 999 000',
        location: 'Bafoussam',
        language: 'fr',
        activeRole: 'provider',
        profileCompletion: 55,
        profile: {
          create: {
            photoUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c5b?w=200',
            bio: 'Caterer for all occasions. Traditional and fusion cuisine.',
            price: 25000,
            availability: 'this_week',
            experience: 10,
            rating: 4.8,
            reviewCount: 67,
            skills: JSON.stringify(['Catering', 'Cleaning']),
            preferences: JSON.stringify([]),
            objective: 'offer_service',
          }
        },
        weights: { create: {} }
      }
    }),
  ]);

  // Create service requests
  const marieRequest = await prisma.serviceRequest.create({
    data: {
      clientId: marie.id,
      title: 'Fix broken bathroom sink',
      description: 'The sink in my bathroom is leaking and needs repair. Looking for an experienced plumber who can come quickly.',
      category: 'Plumbing',
      location: 'Douala',
      budget: 15000,
      urgency: 'urgent',
      skills: JSON.stringify(['Plumbing']),
    }
  });

  const jpRequest = await prisma.serviceRequest.create({
    data: {
      clientId: jp.id,
      title: 'Install new kitchen cabinets',
      description: 'Need someone to install new wooden cabinets in my kitchen. Measurements already done, materials ready.',
      category: 'Carpentry',
      location: 'Yaoundé',
      budget: 45000,
      urgency: 'this_week',
      skills: JSON.stringify(['Carpentry']),
    }
  });

  await prisma.serviceRequest.create({
    data: {
      clientId: sarah.id,
      title: 'Deep cleaning for new apartment',
      description: 'Moving into a new apartment and need thorough cleaning before settling in.',
      category: 'Cleaning',
      location: 'Buea',
      budget: 10000,
      urgency: 'flexible',
      skills: JSON.stringify(['Cleaning']),
    }
  });

  const additionalRequest = await prisma.serviceRequest.create({
    data: {
      clientId: additionalProviders[0].id,
      title: 'Fix electrical wiring in living room',
      description: 'Some outlets stopped working. Need an electrician to check and fix the wiring.',
      category: 'Electrical',
      location: 'Douala',
      budget: 20000,
      urgency: 'urgent',
      skills: JSON.stringify(['Electrical']),
    }
  });

  await prisma.serviceRequest.create({
    data: {
      clientId: additionalProviders[1].id,
      title: 'Repair leaking roof',
      description: 'Rainwater coming through the roof. Need urgent repair before rainy season.',
      category: 'Roofing',
      location: 'Douala',
      budget: 35000,
      urgency: 'urgent',
      skills: JSON.stringify(['Roofing', 'Welding']),
    }
  });

  // Paul swipes right on Marie's request (SCENARIO 1 setup)
  const paulSwipe = await prisma.swipe.create({
    data: {
      swiperId: paul.id,
      targetRequestId: marieRequest.id,
      swiperRole: 'provider',
      direction: 'right',
      fitScore: 87,
    }
  });

  // Create match for this swipe
  const match1 = await prisma.match.create({
    data: {
      clientId: marie.id,
      providerId: paul.id,
      requestId: marieRequest.id,
      initiatedBy: 'provider',
      clientFitScore: 87,
      providerFitScore: 87,
      status: 'provider_interested',
    }
  });

  // Create conversation and messages for SCENARIO 1
  const conversation1 = await prisma.conversation.create({
    data: {
      matchId: match1.id,
    }
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation1.id,
        senderId: paul.id,
        content: 'Bonjour Madame Kamdem, je suis Paul Ekwalla. J\'ai vu votre demande pour la réparation de l\'évier. Je suis disponible aujourd\'hui si cela vous arrange.',
        sentAt: new Date(Date.now() - 3600000),
      },
      {
        conversationId: conversation1.id,
        senderId: marie.id,
        content: 'Bonjour Monsieur Ekwalla. Oui, j\'ai vu que vous vous êtes intéressé à ma demande. Aujourd\'hui serait parfait. À quelle heure pouvez-vous venir?',
        sentAt: new Date(Date.now() - 1800000),
      },
      {
        conversationId: conversation1.id,
        senderId: paul.id,
        content: 'Je peux être chez vous à 14h. Pourriez-vous m\'envoyer l\'adresse exacte?',
        sentAt: new Date(Date.now() - 900000),
      },
    ]
  });

  // Paul swipes on other requests
  await prisma.swipe.create({
    data: {
      swiperId: paul.id,
      targetRequestId: additionalRequest.id,
      swiperRole: 'provider',
      direction: 'right',
      fitScore: 65,
    }
  });

  await prisma.swipe.create({
    data: {
      swiperId: paul.id,
      targetRequestId: jpRequest.id,
      swiperRole: 'provider',
      direction: 'left',
      fitScore: 40,
    }
  });

  // Grace (provider) swiped on Marie's profile when she was in client mode
  await prisma.swipe.create({
    data: {
      swiperId: additionalProviders[0].id,
      targetUserId: marie.id,
      swiperRole: 'provider',
      direction: 'right',
      fitScore: 72,
    }
  });

  // Create match for Grace's swipe
  await prisma.match.create({
    data: {
      clientId: marie.id,
      providerId: additionalProviders[0].id,
      requestId: marieRequest.id,
      initiatedBy: 'provider',
      clientFitScore: 72,
      status: 'provider_interested',
    }
  });

  // JP as provider has a match (SCENARIO 3)
  const jpMatchAsProvider = await prisma.match.create({
    data: {
      clientId: additionalProviders[2].id,
      providerId: jp.id,
      initiatedBy: 'client',
      clientFitScore: 78,
      providerFitScore: 78,
      status: 'mutual',
    }
  });

  // JP as client has a match (SCENARIO 3)
  const alain = additionalProviders[1];
  await prisma.swipe.create({
    data: {
      swiperId: jp.id,
      targetUserId: alain.id,
      swiperRole: 'client',
      direction: 'right',
      fitScore: 85,
    }
  });

  await prisma.match.create({
    data: {
      clientId: jp.id,
      providerId: alain.id,
      requestId: jpRequest.id,
      initiatedBy: 'client',
      clientFitScore: 85,
      status: 'client_interested',
    }
  });

  // Add conversation for JP's provider match
  const jpConversation = await prisma.conversation.create({
    data: {
      matchId: jpMatchAsProvider.id,
    }
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: jpConversation.id,
        senderId: additionalProviders[2].id,
        content: 'Hello, I saw you offer electrical services. I need help with some wiring at my shop.',
        sentAt: new Date(Date.now() - 7200000),
      },
      {
        conversationId: jpConversation.id,
        senderId: jp.id,
        content: 'Yes, I can help with that. What kind of work do you need done?',
        sentAt: new Date(Date.now() - 3600000),
      },
    ]
  });

  // Create notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: paul.id,
        type: 'new_match',
        title: 'New Client Interest',
        body: 'Grace Nkam is interested in your services',
        referenceId: marieRequest.id,
      },
      {
        userId: marie.id,
        type: 'provider_interest',
        title: 'Provider Interested',
        body: 'Paul Ekwalla (87% FitScore) showed interest in your request',
        referenceId: match1.id,
      },
      {
        userId: marie.id,
        type: 'provider_interest',
        title: 'Provider Interested',
        body: 'Grace Nkam (72% FitScore) showed interest in your request',
        referenceId: additionalProviders[0].id,
      },
      {
        userId: jp.id,
        type: 'new_message',
        title: 'New Message',
        body: 'You have a new message from Nadia Menga',
        referenceId: jpConversation.id,
      },
    ]
  });

  // Create sample reviews
  await prisma.review.createMany({
    data: [
      {
        matchId: match1.id,
        reviewerId: marie.id,
        revieweeId: paul.id,
        rating: 5,
        comment: 'Excellent travail, rapide et professionnel!',
      },
      {
        matchId: jpMatchAsProvider.id,
        reviewerId: additionalProviders[2].id,
        revieweeId: jp.id,
        rating: 4,
        comment: 'Good work, arrived on time.',
      },
    ]
  });

  // Additional swipes for discovery
  await prisma.swipe.create({
    data: {
      swiperId: alain.id,
      targetRequestId: marieRequest.id,
      swiperRole: 'provider',
      direction: 'right',
      fitScore: 79,
    }
  });

  await prisma.match.create({
    data: {
      clientId: marie.id,
      providerId: alain.id,
      requestId: marieRequest.id,
      initiatedBy: 'provider',
      clientFitScore: 79,
      status: 'provider_interested',
    }
  });

  console.log('Seed completed successfully!');
  console.log('\nTest accounts (password: password123):');
  console.log('  marie@binder.cm - Client with interested providers');
  console.log('  paul@binder.cm - Provider with active swipes');
  console.log('  jp@binder.cm - Dual-role user');
  console.log('  sarah@binder.cm - New user (empty state)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
