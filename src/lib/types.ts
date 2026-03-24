import { Timestamp } from "firebase/firestore";

export type Stat = {
  value: string;
  label: string;
};

export interface User {
    uid: string;
    email: string;
    role: 'graduate' | 'company' | 'admin';
    status: 'pending' | 'approved' | 'rejected' | 'deleted';
    createdAt: Timestamp;
    
    // Graduate fields
    fullName?: string;
    idNumber?: string;
    phoneNumber?: string;
    campus?: string;
    graduationYear?: number;
    photoUrl?: string;
    career?: string;
    workplace?: string;
    profileDescription?: string;

    // Company fields
    companyName?: string;
    hrManagerName?: string;
    hrManagerEmail?: string;
    hrManagerPhone?: string;
    adminName?: string;
    adminPosition?: string;
    adminArea?: string;
    adminPhone?: string;
    companyDescription?: string;
    companySector?: string;
    companyWebsite?: string;
    companyLocation?: string;
    companySize?: string;
    yearFounded?: number;
    companyCulture?: string;
    employeeBenefits?: string;

    // Deletion fields
    deleteReason?: string;
    deletedAt?: Timestamp;
}

export interface Job {
    id: string;
    title: string;
    description: string;
    requirements: string;
    companyId: string;
    companyName: string;
    createdAt: Timestamp;
    location?: string;
    salary?: string;
    status?: 'active' | 'closed';
    jobType?: 'Tiempo completo' | 'Medio tiempo' | 'Prácticas';
    applicationDeadline?: Timestamp;
}

export interface Post {
    id: string;
    authorId: string;
    authorName: string;
    authorRole: 'graduate' | 'company' | 'admin';
    authorCareer?: string;
    authorCampus?: string;
    authorPhotoUrl: string;
    content: string;
    imageUrl?: string;
    createdAt: Timestamp;
}

export interface Follow {
    id: string;
    followerId: string;
    followingId: string;
    createdAt: Timestamp;
}

export interface Like {
    id: string;
    postId: string;
    userId: string;
    createdAt: Timestamp;
}

export interface Comment {
    id: string;
    postId: string;
    userId: string;
    authorName: string;
    authorPhotoUrl?: string;
    text: string;
    createdAt: Timestamp;
}

export interface JobApplication {
    id: string;
    jobId: string;
    userId: string;
    companyId: string;
    applicantName: string;
    cvUrl: string;
    status: 'sent' | 'reviewed' | 'rejected';
    appliedAt: Timestamp;
}
