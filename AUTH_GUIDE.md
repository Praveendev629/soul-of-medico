# 🔐 Authentication & Features Guide

## ✅ Complete Authentication System

### **Sign In Options:**
1. **Google Sign-In** - One-click authentication
2. **Email/Password** - Traditional login with email verification

### **New User Registration:**
- Sign up with email and password
- Automatic verification email sent
- Must verify email before first login
- Profile created automatically in Firestore

### **Password Management:**
- Forgot Password? → Email reset link
- Secure password recovery
- Reset link expires after 1 hour

### **Profile Management:**
- Edit display name
- Update profile photo URL
- View current avatar
- Changes sync to Firebase Auth

---

## 🎯 Admin Features

### **Admin ID:** `soulofmedico@gmail.com`

The admin email is **automatically detected** and given ADMIN role:

✅ Auto-assigned ADMIN role on first login  
✅ Admin panel appears with management tools  
✅ Can add sections, upload files, add videos  
✅ Full access to all features  

### **How Admin Detection Works:**

1. **First Login (Google):**
   - System checks if email = `soulofmedico@gmail.com`
   - Automatically creates user document with role: 'ADMIN'
   - Admin panel appears immediately

2. **First Login (Email/Password):**
   - After email verification
   - System detects admin email
   - Creates user document with role: 'ADMIN'

3. **Existing User Becoming Admin:**
   - If user already exists but role is wrong
   - System auto-corrects to ADMIN role
   - Updates Firestore document

---

## 📧 Email Verification Flow

### **For New Sign Ups:**

1. User fills sign-up form
2. Account created with unverified email
3. Verification email sent automatically
4. User must check email and click verify link
5. After verification → Can log in
6. First login → Full access granted

### **Why Email Verification?**
- Prevents fake accounts
- Ensures valid email addresses
- Improves security
- Required for password recovery

---

## 🔧 Troubleshooting

### **"Missing or insufficient permissions"**

**Cause:** Firestore rules blocking access

**Solution:**
1. Go to Firebase Console → Firestore Database → Rules
2. Copy contents from `firestore.rules` file
3. Click "Publish" to deploy new rules
4. Wait 1-2 minutes for changes to apply
5. Try logging in again

### **Admin Still Shows as USER**

**Fix:**
1. Log out completely
2. Clear browser cache
3. Log in again with `soulofmedico@gmail.com`
4. Check browser console (F12) for logs
5. Should see: "Updated admin role for soulofmedico@gmail.com"

### **Email Not Verified Error**

**Solution:**
1. Check spam/junk folder
2. Look for email from "Soul of Medico"
3. Click verification link in email
4. Return to app and try logging in again
5. If email not received → Try signing up again

---

## 🎨 Profile Editing

### **How to Edit Profile:**

1. Click profile icon (top right)
2. Choose "OK" for Edit Profile
3. Update your information:
   - Display Name (required)
   - Profile Photo URL (optional)
4. Click "Save Changes"
5. Profile updates instantly

### **Profile Photo:**
- Use direct image URL
- Recommended size: 400x400px
- Formats: JPG, PNG, WebP
- Leave empty for auto-generated avatar

---

## 🚀 Quick Start

### **For Users:**

1. **Sign Up:**
   - Click "Sign Up" button
   - Fill in name, email, password
   - Check email → Click verification link
   
2. **Login:**
   - Enter verified email and password
   - Or use Google Sign-In
   - Access granted!

3. **Edit Profile:**
   - Click profile icon
   - Choose Edit Profile
   - Update info and save

### **For Admin:**

1. **Login as Admin:**
   - Use email: `soulofmedico@gmail.com`
   - Verify email (first time only)
   - Enter password
   - Admin panel appears automatically

2. **Admin Features:**
   - Add Section button
   - Upload File button
   - Add Video button
   - All visible in red-bordered card

---

## 📊 Firestore Collections

### **users/**
```javascript
{
  email: "user@example.com",
  displayName: "John Doe",
  role: "USER" | "ADMIN",
  photoURL: "https://...",
  emailVerified: true/false,
  createdAt: "2024-01-01T00:00:00Z"
}
```

### **videos/**
```javascript
{
  id: "youtube_video_id",
  title: "Video Title",
  thumbnail: "https://...",
  publishedAt: "2024-01-01",
  channelTitle: "Channel Name"
}
```

### **notifications/**
```javascript
{
  title: "New Videos Available!",
  message: "3 new video(s) added",
  read: false,
  createdAt: "2024-01-01T00:00:00Z"
}
```

---

## 🔒 Security Features

✅ Email verification required  
✅ Password minimum 6 characters  
✅ Secure password reset tokens  
✅ Firestore rules protect data  
✅ Role-based access control  
✅ Admin-only write permissions  

---

## 💡 Tips

- **Bookmark** the app after first login
- **Save** your password securely
- **Check** spam folder for verification emails
- **Use** strong passwords
- **Keep** your profile photo URL updated
- **Test** admin features with `soulofmedico@gmail.com`

---

## 🆘 Need Help?

If you're still having issues:

1. Open browser console (F12)
2. Look for error messages
3. Check Firebase Console logs
4. Verify Firestore rules are deployed
5. Ensure email is verified

The app logs detailed information to help debug issues!
