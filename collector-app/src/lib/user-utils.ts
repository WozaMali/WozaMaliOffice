/**
 * Unified User Utilities
 * This file contains shared utilities for handling user data across all WozaMali apps
 */

export interface User {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  phone?: string | null;
  role_id?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserWithRole extends User {
  role_name?: string | null;
  role_description?: string | null;
}

/**
 * Formats a user's display name using a unified approach
 * Priority: first_name + last_name > first_name > last_name > full_name > email extraction
 */
export function formatUserDisplayName(user: User): string {
  // If we have both first and last name, use them
  if (user.first_name && user.last_name && user.first_name.trim() && user.last_name.trim()) {
    return `${capitalizeFirst(user.first_name.trim())} ${capitalizeFirst(user.last_name.trim())}`;
  }
  
  // If we have first name only
  if (user.first_name && user.first_name.trim()) {
    return capitalizeFirst(user.first_name.trim());
  }
  
  // If we have last name only
  if (user.last_name && user.last_name.trim()) {
    return capitalizeFirst(user.last_name.trim());
  }
  
  // If we have full name
  if (user.full_name && user.full_name.trim()) {
    return capitalizeFirst(user.full_name.trim());
  }
  
  // Extract name from email and format it
  if (user.email) {
    return formatNameFromEmail(user.email);
  }
  
  // Final fallback
  return 'Unknown User';
}

/**
 * Extracts and formats a name from an email address
 */
export function formatNameFromEmail(email: string): string {
  const emailName = email.split('@')[0];
  
  // Replace dots, underscores, and numbers with spaces
  let formattedName = emailName
    .replace(/[._-]/g, ' ')
    .replace(/\d+/g, ' ')
    .trim();
  
  // Split into words and capitalize each
  const words = formattedName.split(/\s+/).filter(word => word.length > 0);
  
  if (words.length === 0) {
    return 'Unknown User';
  }
  
  return words.map(word => capitalizeFirst(word)).join(' ');
}

/**
 * Capitalizes the first letter of a string
 */
export function capitalizeFirst(str: string): string {
  if (!str || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Gets user initials for avatar display
 */
export function getUserInitials(user: User): string {
  const displayName = formatUserDisplayName(user);
  const words = displayName.split(' ');
  
  if (words.length >= 2) {
    return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
  } else if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  
  return 'U';
}

/**
 * Gets user role display name
 */
export function getUserRoleDisplayName(roleName: string | null | undefined): string {
  if (!roleName) return 'Unknown Role';
  
  const roleMap: Record<string, string> = {
    'admin': 'Administrator',
    'super_admin': 'Super Administrator',
    'collector': 'Collector',
    'member': 'Member/Resident',
    'resident': 'Resident',
    'office_staff': 'Office Staff'
  };
  
  return roleMap[roleName.toLowerCase()] || capitalizeFirst(roleName);
}

/**
 * Validates user data for signup/registration
 */
export function validateUserData(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // First name validation
  if (!data.firstName.trim()) {
    errors.firstName = 'First name is required';
  } else if (data.firstName.trim().length < 2) {
    errors.firstName = 'First name must be at least 2 characters';
  }

  // Last name validation
  if (!data.lastName.trim()) {
    errors.lastName = 'Last name is required';
  } else if (data.lastName.trim().length < 2) {
    errors.lastName = 'Last name must be at least 2 characters';
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!emailRegex.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Phone validation (optional but if provided, should be valid)
  if (data.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(data.phone.replace(/\s/g, ''))) {
    errors.phone = 'Please enter a valid phone number';
  }

  // Password validation
  if (!data.password) {
    errors.password = 'Password is required';
  } else if (data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  // Confirm password validation
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Formats phone number for display
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Format based on length
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  } else if (digits.length > 10) {
    return `+${digits}`;
  }
  
  return phone;
}

/**
 * Gets user status display
 */
export function getUserStatusDisplay(status: string | null | undefined): {
  text: string;
  color: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
} {
  if (!status) {
    return { text: 'Unknown', color: 'text-gray-500', variant: 'outline' };
  }
  
  const statusMap: Record<string, { text: string; color: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    'active': { text: 'Active', color: 'text-green-500', variant: 'default' },
    'inactive': { text: 'Inactive', color: 'text-red-500', variant: 'destructive' },
    'pending': { text: 'Pending', color: 'text-yellow-500', variant: 'secondary' },
    'suspended': { text: 'Suspended', color: 'text-red-600', variant: 'destructive' }
  };
  
  return statusMap[status.toLowerCase()] || { 
    text: capitalizeFirst(status), 
    color: 'text-gray-500', 
    variant: 'outline' 
  };
}

/**
 * Creates a user object for database insertion
 */
export function createUserObject(data: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
  status?: string;
}): User {
  return {
    id: data.id,
    email: data.email,
    first_name: data.firstName.trim(),
    last_name: data.lastName.trim(),
    full_name: `${data.firstName.trim()} ${data.lastName.trim()}`,
    phone: data.phone?.trim() || null,
    role_id: data.roleId,
    status: data.status || 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}
