import { PrismaClient, UserRole, NiveauType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding de la base de données ISI...');

  // 1. Créer les niveaux académiques ISI
  console.log('📚 Création des niveaux académiques...');
  
  const niveaux = await Promise.all([
    // Licence - 3 années
    prisma.niveau.upsert({
      where: { nom: 'L1' },
      update: {},
      create: { nom: 'L1', type: NiveauType.licence, ordre: 1 }
    }),
    prisma.niveau.upsert({
      where: { nom: 'L2' },
      update: {},
      create: { nom: 'L2', type: NiveauType.licence, ordre: 2 }
    }),
    prisma.niveau.upsert({
      where: { nom: 'L3' },
      update: {},
      create: { nom: 'L3', type: NiveauType.licence, ordre: 3 }
    }),
    // Master - 2 années
    prisma.niveau.upsert({
      where: { nom: 'M1' },
      update: {},
      create: { nom: 'M1', type: NiveauType.master, ordre: 4 }
    }),
    prisma.niveau.upsert({
      where: { nom: 'M2' },
      update: {},
      create: { nom: 'M2', type: NiveauType.master, ordre: 5 }
    }),
    // Ingénieur - 3 années
    prisma.niveau.upsert({
      where: { nom: '1ING' },
      update: {},
      create: { nom: '1ING', type: NiveauType.ingenieur, ordre: 6 }
    }),
    prisma.niveau.upsert({
      where: { nom: '2ING' },
      update: {},
      create: { nom: '2ING', type: NiveauType.ingenieur, ordre: 7 }
    }),
    prisma.niveau.upsert({
      where: { nom: '3ING' },
      update: {},
      create: { nom: '3ING', type: NiveauType.ingenieur, ordre: 8 }
    })
  ]);

  console.log(`✅ ${niveaux.length} niveaux créés`);

  // 2. Créer les semestres pour chaque niveau
  console.log('📅 Création des semestres...');
  
  const semestres = [];
  for (const niveau of niveaux) {
    let semestreNames: string[] = [];
    
    // Déterminer les semestres selon le niveau
    if (niveau.nom === 'L1' || niveau.nom === 'M1' || niveau.nom === '1ING') {
      semestreNames = ['S1', 'S2'];
    } else if (niveau.nom === 'L2' || niveau.nom === 'M2' || niveau.nom === '2ING') {
      semestreNames = ['S3', 'S4'];
    } else if (niveau.nom === 'L3' || niveau.nom === '3ING') {
      semestreNames = ['S5', 'S6'];
    }

    for (let i = 0; i < semestreNames.length; i++) {
      const semestre = await prisma.semestre.upsert({
        where: { 
          niveauId_ordre: { 
            niveauId: niveau.id, 
            ordre: i + 1 
          } 
        },
        update: {},
        create: {
          nom: semestreNames[i],
          niveauId: niveau.id,
          ordre: i + 1
        }
      });
      semestres.push(semestre);
    }
  }

  console.log(`✅ ${semestres.length} semestres créés`);

  // 3. Créer les filières ISI
  console.log('🎓 Création des filières...');
  
  const filieres = [];

  // Licence - CS, IRS, SE pour chaque niveau L1, L2, L3
  const licenceNiveaux = niveaux.filter(n => n.nom.startsWith('L'));
  const licenceSpecializations = [
    { code: 'CS', nom: 'Licence en sciences de l\'informatique' },
    { code: 'IRS', nom: 'Licence en ingénierie des systèmes informatiques' },
    { code: 'SE', nom: 'Electronique, Electrotechnique et Automatique' }
  ];

  for (const niveau of licenceNiveaux) {
    for (const spec of licenceSpecializations) {
      const filiere = await prisma.filiere.upsert({
        where: { code: `${niveau.nom}-${spec.code}` },
        update: {},
        create: {
          nom: spec.nom,
          code: `${niveau.nom}-${spec.code}`,
          niveauId: niveau.id
        }
      });
      filieres.push(filiere);
    }
  }

  // Masters Professionnels et de Recherche
  const masterNiveaux = niveaux.filter(n => n.nom.startsWith('M'));
  const masterFilieres = [
    { code: 'SSII', nom: 'Sécurité des Systèmes d\'Informations et des Infrastructures' },
    { code: 'MP2L', nom: 'Mastère Professionnel en Logiciels Libres' },
    { code: 'SIIOT', nom: 'Mastère Professionnel en Systèmes Intelligents et IoT' },
    { code: 'MDL', nom: 'Master Professionnel en Développement Logiciel Et nouvelles technologies' },
    { code: 'SIIVA', nom: 'Mastère de Recherche - Option Sciences Images' },
    { code: 'GL', nom: 'Mastère de Recherche - Option Génie Logiciel' }
  ];

  for (const masterFiliere of masterFilieres) {
    for (const niveau of masterNiveaux) {
      const filiere = await prisma.filiere.upsert({
        where: { code: `${niveau.nom}-${masterFiliere.code}` },
        update: {},
        create: {
          nom: masterFiliere.nom,
          code: `${niveau.nom}-${masterFiliere.code}`,
          niveauId: niveau.id
        }
      });
      filieres.push(filiere);
    }
  }

  // Ingénieur - 1ING commun, puis spécialisations pour 2ING et 3ING
  const ing1Niveau = niveaux.find(n => n.nom === '1ING');
  const ing1Filiere = await prisma.filiere.upsert({
    where: { code: '1ING-COMMUN' },
    update: {},
    create: {
      nom: 'Cycle d\'Ingénieur - Tronc Commun',
      code: '1ING-COMMUN',
      niveauId: ing1Niveau!.id
    }
  });
  filieres.push(ing1Filiere);

  // Spécialisations Ingénieur pour 2ING et 3ING
  const ingSpecNiveaux = niveaux.filter(n => n.nom === '2ING' || n.nom === '3ING');
  const ingSpecializations = [
    { code: 'IDL', nom: 'Ingénierie de Développement du Logiciel' },
    { code: 'IDISC', nom: 'Ingénierie et Développement des Infrastructures et des Services de Communications' },
    { code: 'ISEOC', nom: 'Ingénierie des Systèmes Embarqués et Objets Connectés' }
  ];

  for (const niveau of ingSpecNiveaux) {
    for (const spec of ingSpecializations) {
      const filiere = await prisma.filiere.upsert({
        where: { code: `${niveau.nom}-${spec.code}` },
        update: {},
        create: {
          nom: spec.nom,
          code: `${niveau.nom}-${spec.code}`,
          niveauId: niveau.id
        }
      });
      filieres.push(filiere);
    }
  }

  console.log(`✅ ${filieres.length} filières créées`);

  // 4. Créer des matières pour chaque filière
  console.log('📖 Création des matières...');
  
  const matieres = [];
  
  // Matières génériques par type de formation
  const matieresCS = [
    'Algorithmique et Structures de Données',
    'Programmation Orientée Objet',
    'Bases de Données',
    'Systèmes d\'Exploitation',
    'Réseaux Informatiques',
    'Génie Logiciel'
  ];

  const matieresIRS = [
    'Architecture des Ordinateurs',
    'Systèmes Embarqués',
    'Réseaux et Télécommunications',
    'Sécurité Informatique',
    'Administration Systèmes',
    'Protocoles Réseaux'
  ];

  const matieresSE = [
    'Électronique Analogique',
    'Électronique Numérique',
    'Automatique',
    'Traitement du Signal',
    'Microprocesseurs',
    'Systèmes de Contrôle'
  ];

  const matieresIDL = [
    'Développement Web Avancé',
    'Frameworks JavaScript',
    'Architecture Logicielle',
    'DevOps et CI/CD',
    'Tests et Qualité Logicielle',
    'Gestion de Projets Agiles'
  ];

  const matieresIDISC = [
    'Réseaux Haut Débit',
    'Sécurité des Communications',
    'Cloud Computing',
    'Virtualisation',
    'Services Web',
    'Infrastructure IT'
  ];

  const matieresISEOC = [
    'Internet des Objets',
    'Systèmes Embarqués Temps Réel',
    'Capteurs et Actionneurs',
    'Communication Sans Fil',
    'Programmation Embarquée',
    'Edge Computing'
  ];

  const matieresGeneriques = [
    'Mathématiques Appliquées',
    'Anglais Technique',
    'Communication',
    'Entrepreneuriat',
    'Éthique et Déontologie',
    'Stage/Projet'
  ];

  // Créer les matières pour chaque filière
  for (const filiere of filieres) {
    let matieresListe: string[] = [];
    
    if (filiere.code.includes('CS')) {
      matieresListe = matieresCS;
    } else if (filiere.code.includes('IRS')) {
      matieresListe = matieresIRS;
    } else if (filiere.code.includes('SE')) {
      matieresListe = matieresSE;
    } else if (filiere.code.includes('IDL')) {
      matieresListe = matieresIDL;
    } else if (filiere.code.includes('IDISC')) {
      matieresListe = matieresIDISC;
    } else if (filiere.code.includes('ISEOC')) {
      matieresListe = matieresISEOC;
    } else {
      matieresListe = matieresGeneriques;
    }

    // Obtenir les semestres pour cette filière
    const filiereSemestres = semestres.filter(s => s.niveauId === filiere.niveauId);
    
    // Distribuer les matières sur les semestres
    for (let i = 0; i < Math.min(matieresListe.length, filiereSemestres.length * 3); i++) {
      const semestreIndex = i % filiereSemestres.length;
      const semestre = filiereSemestres[semestreIndex];
      const matiereNom = matieresListe[i % matieresListe.length];
      
      const matiere = await prisma.matiere.upsert({
        where: { 
          code_filiereId: { 
            code: `${filiere.code}-MAT${i + 1}`, 
            filiereId: filiere.id 
          } 
        },
        update: {},
        create: {
          nom: matiereNom,
          code: `${filiere.code}-MAT${i + 1}`,
          filiereId: filiere.id,
          semestreId: semestre.id
        }
      });
      matieres.push(matiere);
    }

    // Ajouter des matières génériques à chaque filière
    for (let j = 0; j < Math.min(matieresGeneriques.length, filiereSemestres.length * 2); j++) {
      const semestreIndex = j % filiereSemestres.length;
      const semestre = filiereSemestres[semestreIndex];
      const matiereNom = matieresGeneriques[j % matieresGeneriques.length];
      
      const matiere = await prisma.matiere.upsert({
        where: { 
          code_filiereId: { 
            code: `${filiere.code}-GEN${j + 1}`, 
            filiereId: filiere.id 
          } 
        },
        update: {},
        create: {
          nom: matiereNom,
          code: `${filiere.code}-GEN${j + 1}`,
          filiereId: filiere.id,
          semestreId: semestre.id
        }
      });
      matieres.push(matiere);
    }
  }

  console.log(`✅ ${matieres.length} matières créées`);

  // 5. Créer l'utilisateur admin par défaut
  console.log('👤 Création de l\'utilisateur admin...');
  
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@isi.tn' },
    update: {},
    create: {
      email: 'admin@isi.tn',
      password: hashedPassword,
      prenom: 'Admin',
      nom: 'ISI',
      role: UserRole.admin,
      isActive: true
    }
  });

  console.log('✅ Utilisateur admin créé:', admin.email);

  // 6. Créer des professeurs d'exemple
  console.log('👨‍🏫 Création des professeurs d\'exemple...');
  
  const profPassword = await bcrypt.hash('prof123', 12);
  
  const professeurs = await Promise.all([
    // Professeur 1 - CS/Informatique
    prisma.user.upsert({
      where: { email: 'prof.cs@isi.tn' },
      update: {},
      create: {
        email: 'prof.cs@isi.tn',
        password: profPassword,
        prenom: 'Mohamed',
        nom: 'Ben Ahmed',
        role: UserRole.professeur,
        isActive: true
      }
    }),
    // Professeur 2 - IRS/Réseaux
    prisma.user.upsert({
      where: { email: 'prof.irs@isi.tn' },
      update: {},
      create: {
        email: 'prof.irs@isi.tn',
        password: profPassword,
        prenom: 'Fatma',
        nom: 'Trabelsi',
        role: UserRole.professeur,
        isActive: true
      }
    }),
    // Professeur 3 - SE/Électronique
    prisma.user.upsert({
      where: { email: 'prof.se@isi.tn' },
      update: {},
      create: {
        email: 'prof.se@isi.tn',
        password: profPassword,
        prenom: 'Ahmed',
        nom: 'Khelifi',
        role: UserRole.professeur,
        isActive: true
      }
    }),
    // Professeur 4 - Master/Recherche
    prisma.user.upsert({
      where: { email: 'prof.master@isi.tn' },
      update: {},
      create: {
        email: 'prof.master@isi.tn',
        password: profPassword,
        prenom: 'Sonia',
        nom: 'Hamdi',
        role: UserRole.professeur,
        isActive: true
      }
    }),
    // Professeur 5 - Ingénieur
    prisma.user.upsert({
      where: { email: 'prof.ing@isi.tn' },
      update: {},
      create: {
        email: 'prof.ing@isi.tn',
        password: profPassword,
        prenom: 'Karim',
        nom: 'Bouaziz',
        role: UserRole.professeur,
        isActive: true
      }
    }),
    // Professeur 6 - Mathématiques/Généraliste
    prisma.user.upsert({
      where: { email: 'prof.math@isi.tn' },
      update: {},
      create: {
        email: 'prof.math@isi.tn',
        password: profPassword,
        prenom: 'Nadia',
        nom: 'Mansouri',
        role: UserRole.professeur,
        isActive: true
      }
    })
  ]);

  // Assigner les professeurs aux matières selon leur spécialité
  console.log('📚 Assignation des professeurs aux matières...');
  
  // Prepare all professor assignments
  const professorAssignments: Array<{
    professeurId: string;
    matiereId: string;
    role: 'cours' | 'td' | 'tp';
  }> = [];

  // Professeur CS - matières informatiques de licence
  const matieresCSProf = matieres.filter(m => 
    m.code.includes('CS') && 
    (m.nom.includes('Algorithmique') || m.nom.includes('Programmation') || m.nom.includes('Bases de Données') || m.nom.includes('Génie Logiciel'))
  );
  
  for (const matiere of matieresCSProf.slice(0, 8)) {
    // Assign as cours professor
    professorAssignments.push({
      professeurId: professeurs[0].id,
      matiereId: matiere.id,
      role: 'cours'
    });
    
    // Some subjects also have TD
    if (matiere.nom.includes('Programmation') || matiere.nom.includes('Algorithmique')) {
      professorAssignments.push({
        professeurId: professeurs[0].id,
        matiereId: matiere.id,
        role: 'td'
      });
    }
  }

  // Professeur IRS - matières réseaux et systèmes
  const matieresIRSProf = matieres.filter(m => 
    m.code.includes('IRS') || 
    (m.nom.includes('Réseaux') || m.nom.includes('Systèmes') || m.nom.includes('Sécurité') || m.nom.includes('Administration'))
  );
  
  for (const matiere of matieresIRSProf.slice(0, 8)) {
    professorAssignments.push({
      professeurId: professeurs[1].id,
      matiereId: matiere.id,
      role: 'cours'
    });
    
    // Add TP for practical subjects
    if (matiere.nom.includes('Réseaux') || matiere.nom.includes('Administration')) {
      professorAssignments.push({
        professeurId: professeurs[1].id,
        matiereId: matiere.id,
        role: 'tp'
      });
    }
  }

  // Professeur SE - matières électronique
  const matieresSEProf = matieres.filter(m => 
    m.code.includes('SE') || 
    (m.nom.includes('Électronique') || m.nom.includes('Automatique') || m.nom.includes('Signal') || m.nom.includes('Microprocesseurs'))
  );
  
  for (const matiere of matieresSEProf.slice(0, 8)) {
    professorAssignments.push({
      professeurId: professeurs[2].id,
      matiereId: matiere.id,
      role: 'cours'
    });
    
    // Add TP for electronics subjects
    professorAssignments.push({
      professeurId: professeurs[2].id,
      matiereId: matiere.id,
      role: 'tp'
    });
  }

  // Professeur Master - matières de master
  const matieresMasterProf = matieres.filter(m => 
    m.code.includes('M1-') || m.code.includes('M2-') ||
    (m.nom.includes('Sécurité') || m.nom.includes('IoT') || m.nom.includes('Logiciels Libres') || m.nom.includes('Images'))
  );
  
  for (const matiere of matieresMasterProf.slice(0, 10)) {
    professorAssignments.push({
      professeurId: professeurs[3].id,
      matiereId: matiere.id,
      role: 'cours'
    });
  }

  // Professeur Ingénieur - matières d'ingénieur
  const matieresIngProf = matieres.filter(m => 
    m.code.includes('ING-') ||
    (m.nom.includes('Développement Web') || m.nom.includes('DevOps') || m.nom.includes('Architecture') || m.nom.includes('Objets Connectés'))
  );
  
  for (const matiere of matieresIngProf.slice(0, 10)) {
    professorAssignments.push({
      professeurId: professeurs[4].id,
      matiereId: matiere.id,
      role: 'cours'
    });
    
    // Add TD and TP for development subjects
    if (matiere.nom.includes('Développement') || matiere.nom.includes('DevOps')) {
      professorAssignments.push({
        professeurId: professeurs[4].id,
        matiereId: matiere.id,
        role: 'td'
      });
      
      professorAssignments.push({
        professeurId: professeurs[4].id,
        matiereId: matiere.id,
        role: 'tp'
      });
    }
  }

  // Professeur Math - matières génériques (mathématiques, anglais, communication)
  const matieresGeneriquesProf = matieres.filter(m => 
    m.nom.includes('Mathématiques') || m.nom.includes('Anglais') || m.nom.includes('Communication') || 
    m.nom.includes('Entrepreneuriat') || m.nom.includes('Éthique')
  );
  
  for (const matiere of matieresGeneriquesProf.slice(0, 12)) {
    professorAssignments.push({
      professeurId: professeurs[5].id,
      matiereId: matiere.id,
      role: 'cours'
    });
    
    // Add TD for math subjects
    if (matiere.nom.includes('Mathématiques')) {
      professorAssignments.push({
        professeurId: professeurs[5].id,
        matiereId: matiere.id,
        role: 'td'
      });
    }
  }

  // Create all assignments at once, skipping duplicates
  if (professorAssignments.length > 0) {
    await prisma.professeurMatiere.createMany({
      data: professorAssignments,
      skipDuplicates: true
    });
  }

  console.log(`✅ ${professeurs.length} professeurs créés et assignés aux matières`);

  // 7. Créer des étudiants d'exemple
  console.log('👨‍🎓 Création des étudiants d\'exemple...');
  
  const etudiantPassword = await bcrypt.hash('etudiant123', 12);
  
  // Étudiant L1 CS
  const filiereL1CS = filieres.find(f => f.code === 'L1-CS');
  const niveauL1 = niveaux.find(n => n.nom === 'L1');
  
  const etudiantL1 = await prisma.user.upsert({
    where: { email: 'etudiant.l1@isi.tn' },
    update: {},
    create: {
      email: 'etudiant.l1@isi.tn',
      password: etudiantPassword,
      prenom: 'Ahmed',
      nom: 'Étudiant L1',
      role: UserRole.etudiant,
      isActive: true,
      filiereId: filiereL1CS?.id,
      niveauId: niveauL1?.id
    }
  });

  // Étudiant L2 IRS
  const filiereL2IRS = filieres.find(f => f.code === 'L2-IRS');
  const niveauL2 = niveaux.find(n => n.nom === 'L2');
  
  const etudiantL2 = await prisma.user.upsert({
    where: { email: 'etudiant.l2@isi.tn' },
    update: {},
    create: {
      email: 'etudiant.l2@isi.tn',
      password: etudiantPassword,
      prenom: 'Fatma',
      nom: 'Étudiant L2',
      role: UserRole.etudiant,
      isActive: true,
      filiereId: filiereL2IRS?.id,
      niveauId: niveauL2?.id
    }
  });

  // Étudiant L3 SE
  const filiereL3SE = filieres.find(f => f.code === 'L3-SE');
  const niveauL3 = niveaux.find(n => n.nom === 'L3');
  
  const etudiantL3 = await prisma.user.upsert({
    where: { email: 'etudiant.l3@isi.tn' },
    update: {},
    create: {
      email: 'etudiant.l3@isi.tn',
      password: etudiantPassword,
      prenom: 'Karim',
      nom: 'Étudiant L3',
      role: UserRole.etudiant,
      isActive: true,
      filiereId: filiereL3SE?.id,
      niveauId: niveauL3?.id
    }
  });

  // Étudiant M1 SSII
  const filiereM1SSII = filieres.find(f => f.code === 'M1-SSII');
  const niveauM1 = niveaux.find(n => n.nom === 'M1');
  
  const etudiantM1 = await prisma.user.upsert({
    where: { email: 'etudiant.m1@isi.tn' },
    update: {},
    create: {
      email: 'etudiant.m1@isi.tn',
      password: etudiantPassword,
      prenom: 'Sonia',
      nom: 'Étudiant M1',
      role: UserRole.etudiant,
      isActive: true,
      filiereId: filiereM1SSII?.id,
      niveauId: niveauM1?.id
    }
  });

  // Étudiant 2ING IDL
  const filiere2INGIDL = filieres.find(f => f.code === '2ING-IDL');
  const niveau2ING = niveaux.find(n => n.nom === '2ING');
  
  const etudiant2ING = await prisma.user.upsert({
    where: { email: 'etudiant.2ing@isi.tn' },
    update: {},
    create: {
      email: 'etudiant.2ing@isi.tn',
      password: etudiantPassword,
      prenom: 'Nadia',
      nom: 'Étudiant 2ING',
      role: UserRole.etudiant,
      isActive: true,
      filiereId: filiere2INGIDL?.id,
      niveauId: niveau2ING?.id
    }
  });

  // New student user for testing - contact@khalilkhalef.com
  const filiereL1CSForNewStudent = filieres.find(f => f.code === 'L1-CS');
  const niveauL1ForNewStudent = niveaux.find(n => n.nom === 'L1');
  
  const newTestStudent = await prisma.user.upsert({
    where: { email: 'contact@khalilkhalef.com' },
    update: {},
    create: {
      email: 'contact@khalilkhalef.com',
      password: etudiantPassword,
      prenom: 'Khalil',
      nom: 'Khalef',
      role: UserRole.etudiant,
      isActive: true,
      filiereId: filiereL1CSForNewStudent?.id,
      niveauId: niveauL1ForNewStudent?.id
    }
  });

  // Additional test users
  const filiereL2CSForTest = filieres.find(f => f.code === 'L2-CS');
  const niveauL2ForTest = niveaux.find(n => n.nom === 'L2');
  
  const testStudent2 = await prisma.user.upsert({
    where: { email: 'mastertores3@gmail.com' },
    update: {},
    create: {
      email: 'mastertores3@gmail.com',
      password: etudiantPassword,
      prenom: 'Master',
      nom: 'Tores',
      role: UserRole.etudiant,
      isActive: true,
      filiereId: filiereL2CSForTest?.id,
      niveauId: niveauL2ForTest?.id
    }
  });

  const filiereL3CSForTest = filieres.find(f => f.code === 'L3-CS');
  const niveauL3ForTest = niveaux.find(n => n.nom === 'L3');
  
  const testStudent3 = await prisma.user.upsert({
    where: { email: 'khalef.b.khalil@gmail.com' },
    update: {},
    create: {
      email: 'khalef.b.khalil@gmail.com',
      password: etudiantPassword,
      prenom: 'Khalil',
      nom: 'Ben Khalef',
      role: UserRole.etudiant,
      isActive: true,
      filiereId: filiereL3CSForTest?.id,
      niveauId: niveauL3ForTest?.id
    }
  });

  const etudiants = [etudiantL1, etudiantL2, etudiantL3, etudiantM1, etudiant2ING, newTestStudent, testStudent2, testStudent3];
  console.log(`✅ ${etudiants.length} étudiants créés`);

  console.log('\n🎉 Seeding ISI terminé avec succès !');
  console.log('\n📋 Comptes créés :');
  console.log('👤 Admin: admin@isi.tn / admin123');
  console.log('👨‍🏫 Professeurs:');
  professeurs.forEach((prof, index) => {
    console.log(`👨‍🏫 Professeur ${index + 1}: ${prof.email} / prof123`);
  });
  console.log('👨‍🎓 Étudiants:');
  etudiants.forEach((etudiant, index) => {
    console.log(`👨‍🎓 Étudiant ${index + 1}: ${etudiant.email} / etudiant123`);
  });
  console.log('👨‍🎓 Test Student: contact@khalilkhalef.com / etudiant123');
  console.log('\n📊 Données créées :');
  console.log(`📚 ${niveaux.length} niveaux académiques`);
  console.log(`📅 ${semestres.length} semestres`);
  console.log(`🎓 ${filieres.length} filières`);
  console.log(`📖 ${matieres.length} matières`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 