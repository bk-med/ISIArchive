"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Début du seeding de la base de données ISI...');
    console.log('📚 Création des niveaux académiques...');
    const niveaux = await Promise.all([
        prisma.niveau.upsert({
            where: { nom: 'L1' },
            update: {},
            create: { nom: 'L1', type: client_1.NiveauType.licence, ordre: 1 }
        }),
        prisma.niveau.upsert({
            where: { nom: 'L2' },
            update: {},
            create: { nom: 'L2', type: client_1.NiveauType.licence, ordre: 2 }
        }),
        prisma.niveau.upsert({
            where: { nom: 'L3' },
            update: {},
            create: { nom: 'L3', type: client_1.NiveauType.licence, ordre: 3 }
        }),
        prisma.niveau.upsert({
            where: { nom: 'M1' },
            update: {},
            create: { nom: 'M1', type: client_1.NiveauType.master, ordre: 4 }
        }),
        prisma.niveau.upsert({
            where: { nom: 'M2' },
            update: {},
            create: { nom: 'M2', type: client_1.NiveauType.master, ordre: 5 }
        }),
        prisma.niveau.upsert({
            where: { nom: '1ING' },
            update: {},
            create: { nom: '1ING', type: client_1.NiveauType.ingenieur, ordre: 6 }
        }),
        prisma.niveau.upsert({
            where: { nom: '2ING' },
            update: {},
            create: { nom: '2ING', type: client_1.NiveauType.ingenieur, ordre: 7 }
        }),
        prisma.niveau.upsert({
            where: { nom: '3ING' },
            update: {},
            create: { nom: '3ING', type: client_1.NiveauType.ingenieur, ordre: 8 }
        })
    ]);
    console.log(`✅ ${niveaux.length} niveaux créés`);
    console.log('📅 Création des semestres...');
    const semestres = [];
    for (const niveau of niveaux) {
        let semestreNames = [];
        if (niveau.nom === 'L1' || niveau.nom === 'M1' || niveau.nom === '1ING') {
            semestreNames = ['S1', 'S2'];
        }
        else if (niveau.nom === 'L2' || niveau.nom === 'M2' || niveau.nom === '2ING') {
            semestreNames = ['S3', 'S4'];
        }
        else if (niveau.nom === 'L3' || niveau.nom === '3ING') {
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
    console.log('🎓 Création des filières...');
    const filieres = [];
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
    const ing1Niveau = niveaux.find(n => n.nom === '1ING');
    const ing1Filiere = await prisma.filiere.upsert({
        where: { code: '1ING-COMMUN' },
        update: {},
        create: {
            nom: 'Cycle d\'Ingénieur - Tronc Commun',
            code: '1ING-COMMUN',
            niveauId: ing1Niveau.id
        }
    });
    filieres.push(ing1Filiere);
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
    console.log('📖 Création des matières...');
    const matieres = [];
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
    for (const filiere of filieres) {
        let matieresListe = [];
        if (filiere.code.includes('CS')) {
            matieresListe = matieresCS;
        }
        else if (filiere.code.includes('IRS')) {
            matieresListe = matieresIRS;
        }
        else if (filiere.code.includes('SE')) {
            matieresListe = matieresSE;
        }
        else if (filiere.code.includes('IDL')) {
            matieresListe = matieresIDL;
        }
        else if (filiere.code.includes('IDISC')) {
            matieresListe = matieresIDISC;
        }
        else if (filiere.code.includes('ISEOC')) {
            matieresListe = matieresISEOC;
        }
        else {
            matieresListe = matieresGeneriques;
        }
        const filiereSemestres = semestres.filter(s => s.niveauId === filiere.niveauId);
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
            role: client_1.UserRole.admin,
            isActive: true
        }
    });
    console.log('✅ Utilisateur admin créé:', admin.email);
    console.log('👨‍🏫 Création des professeurs d\'exemple...');
    const profPassword = await bcrypt.hash('prof123', 12);
    const professeurs = await Promise.all([
        prisma.user.upsert({
            where: { email: 'prof.cs@isi.tn' },
            update: {},
            create: {
                email: 'prof.cs@isi.tn',
                password: profPassword,
                prenom: 'Mohamed',
                nom: 'Ben Ahmed',
                role: client_1.UserRole.professeur,
                isActive: true
            }
        }),
        prisma.user.upsert({
            where: { email: 'prof.irs@isi.tn' },
            update: {},
            create: {
                email: 'prof.irs@isi.tn',
                password: profPassword,
                prenom: 'Fatma',
                nom: 'Trabelsi',
                role: client_1.UserRole.professeur,
                isActive: true
            }
        }),
        prisma.user.upsert({
            where: { email: 'prof.se@isi.tn' },
            update: {},
            create: {
                email: 'prof.se@isi.tn',
                password: profPassword,
                prenom: 'Ahmed',
                nom: 'Khelifi',
                role: client_1.UserRole.professeur,
                isActive: true
            }
        }),
        prisma.user.upsert({
            where: { email: 'prof.master@isi.tn' },
            update: {},
            create: {
                email: 'prof.master@isi.tn',
                password: profPassword,
                prenom: 'Sonia',
                nom: 'Hamdi',
                role: client_1.UserRole.professeur,
                isActive: true
            }
        }),
        prisma.user.upsert({
            where: { email: 'prof.ing@isi.tn' },
            update: {},
            create: {
                email: 'prof.ing@isi.tn',
                password: profPassword,
                prenom: 'Karim',
                nom: 'Bouaziz',
                role: client_1.UserRole.professeur,
                isActive: true
            }
        }),
        prisma.user.upsert({
            where: { email: 'prof.math@isi.tn' },
            update: {},
            create: {
                email: 'prof.math@isi.tn',
                password: profPassword,
                prenom: 'Nadia',
                nom: 'Mansouri',
                role: client_1.UserRole.professeur,
                isActive: true
            }
        })
    ]);
    console.log('📚 Assignation des professeurs aux matières...');
    const professorAssignments = [];
    const matieresCSProf = matieres.filter(m => m.code.includes('CS') &&
        (m.nom.includes('Algorithmique') || m.nom.includes('Programmation') || m.nom.includes('Bases de Données') || m.nom.includes('Génie Logiciel')));
    for (const matiere of matieresCSProf.slice(0, 8)) {
        professorAssignments.push({
            professeurId: professeurs[0].id,
            matiereId: matiere.id,
            role: 'cours'
        });
        if (matiere.nom.includes('Programmation') || matiere.nom.includes('Algorithmique')) {
            professorAssignments.push({
                professeurId: professeurs[0].id,
                matiereId: matiere.id,
                role: 'td'
            });
        }
    }
    const matieresIRSProf = matieres.filter(m => m.code.includes('IRS') ||
        (m.nom.includes('Réseaux') || m.nom.includes('Systèmes') || m.nom.includes('Sécurité') || m.nom.includes('Administration')));
    for (const matiere of matieresIRSProf.slice(0, 8)) {
        professorAssignments.push({
            professeurId: professeurs[1].id,
            matiereId: matiere.id,
            role: 'cours'
        });
        if (matiere.nom.includes('Réseaux') || matiere.nom.includes('Administration')) {
            professorAssignments.push({
                professeurId: professeurs[1].id,
                matiereId: matiere.id,
                role: 'tp'
            });
        }
    }
    const matieresSEProf = matieres.filter(m => m.code.includes('SE') ||
        (m.nom.includes('Électronique') || m.nom.includes('Automatique') || m.nom.includes('Signal') || m.nom.includes('Microprocesseurs')));
    for (const matiere of matieresSEProf.slice(0, 8)) {
        professorAssignments.push({
            professeurId: professeurs[2].id,
            matiereId: matiere.id,
            role: 'cours'
        });
        professorAssignments.push({
            professeurId: professeurs[2].id,
            matiereId: matiere.id,
            role: 'tp'
        });
    }
    const matieresMasterProf = matieres.filter(m => m.code.includes('M1-') || m.code.includes('M2-') ||
        (m.nom.includes('Sécurité') || m.nom.includes('IoT') || m.nom.includes('Logiciels Libres') || m.nom.includes('Images')));
    for (const matiere of matieresMasterProf.slice(0, 10)) {
        professorAssignments.push({
            professeurId: professeurs[3].id,
            matiereId: matiere.id,
            role: 'cours'
        });
    }
    const matieresIngProf = matieres.filter(m => m.code.includes('ING-') ||
        (m.nom.includes('Développement Web') || m.nom.includes('DevOps') || m.nom.includes('Architecture') || m.nom.includes('Objets Connectés')));
    for (const matiere of matieresIngProf.slice(0, 10)) {
        professorAssignments.push({
            professeurId: professeurs[4].id,
            matiereId: matiere.id,
            role: 'cours'
        });
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
    const matieresGeneriquesProf = matieres.filter(m => m.nom.includes('Mathématiques') || m.nom.includes('Anglais') || m.nom.includes('Communication') ||
        m.nom.includes('Entrepreneuriat') || m.nom.includes('Éthique'));
    for (const matiere of matieresGeneriquesProf.slice(0, 12)) {
        professorAssignments.push({
            professeurId: professeurs[5].id,
            matiereId: matiere.id,
            role: 'cours'
        });
        if (matiere.nom.includes('Mathématiques')) {
            professorAssignments.push({
                professeurId: professeurs[5].id,
                matiereId: matiere.id,
                role: 'td'
            });
        }
    }
    if (professorAssignments.length > 0) {
        await prisma.professeurMatiere.createMany({
            data: professorAssignments,
            skipDuplicates: true
        });
    }
    console.log(`✅ ${professeurs.length} professeurs créés et assignés aux matières`);
    console.log('👨‍🎓 Création des étudiants d\'exemple...');
    const etudiantPassword = await bcrypt.hash('etudiant123', 12);
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
            role: client_1.UserRole.etudiant,
            isActive: true,
            filiereId: filiereL1CS?.id,
            niveauId: niveauL1?.id
        }
    });
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
            role: client_1.UserRole.etudiant,
            isActive: true,
            filiereId: filiereL2IRS?.id,
            niveauId: niveauL2?.id
        }
    });
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
            role: client_1.UserRole.etudiant,
            isActive: true,
            filiereId: filiereL3SE?.id,
            niveauId: niveauL3?.id
        }
    });
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
            role: client_1.UserRole.etudiant,
            isActive: true,
            filiereId: filiereM1SSII?.id,
            niveauId: niveauM1?.id
        }
    });
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
            role: client_1.UserRole.etudiant,
            isActive: true,
            filiereId: filiere2INGIDL?.id,
            niveauId: niveau2ING?.id
        }
    });
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
            role: client_1.UserRole.etudiant,
            isActive: true,
            filiereId: filiereL1CSForNewStudent?.id,
            niveauId: niveauL1ForNewStudent?.id
        }
    });
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
            role: client_1.UserRole.etudiant,
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
            role: client_1.UserRole.etudiant,
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
//# sourceMappingURL=seed.js.map