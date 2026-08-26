import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Target,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Compass,
  GraduationCap,
  Globe,
  Briefcase,
  Plane,
  Award,
} from 'lucide-react';
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  loginAsGuest,
} from '../../utils/firebaseAuth';
import { UserProfile, StudyGoal, DailyTimeBudget } from '../../types';
import { sounds } from '../../utils/soundEffects';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Personalization fields during sign up
  const [targetBand, setTargetBand] = useState<number>(7.5);
  const [currentBand, setCurrentBand] = useState<number>(6.0);
  const [studyGoal, setStudyGoal] = useState<StudyGoal>('study_abroad');
  const [dailyBudget, setDailyBudget] = useState<DailyTimeBudget>(30);
  const [targetExamDate, setTargetExamDate] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    sounds.playClick();

    try {
      if (mode === 'signin') {
        const { profile } = await loginWithEmail(email, password);
        sounds.playSuccess();
        onAuthSuccess(profile);
        onClose();
      } else {
        if (!displayName.trim()) {
          setErrorMsg('Vui lòng nhập họ tên hoặc biệt danh của bạn.');
          setLoading(false);
          return;
        }

        const additionalData: Partial<UserProfile> = {
          targetBand,
          currentBand,
          studyGoal,
          dailyBudgetMinutes: dailyBudget,
          targetExamDate: targetExamDate || undefined,
        };

        const { profile } = await registerWithEmail(email, password, displayName, additionalData);
        sounds.playSuccess();
        onAuthSuccess(profile);
        onClose();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = 'Email hoặc mật khẩu không chính xác.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Email này đã được đăng ký tài khoản. Vui lòng chọn Đăng Nhập.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Mật khẩu quá ngắn. Vui lòng nhập tối thiểu 6 ký tự.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Định dạng email không hợp lệ.';
      }
      setErrorMsg(msg);
      sounds.playWrong();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    sounds.playClick();

    try {
      const { profile } = await loginWithGoogle();
      sounds.playSuccess();
      onAuthSuccess(profile);
      onClose();
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setErrorMsg('Không thể đăng nhập bằng Google. Vui lòng thử lại hoặc dùng Email.');
      sounds.playWrong();
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    sounds.playClick();

    try {
      const { profile } = await loginAsGuest('Học viên Khách');
      sounds.playSuccess();
      onAuthSuccess(profile);
      onClose();
    } catch (err) {
      console.error('Guest Sign In Error:', err);
      setErrorMsg('Không thể kích hoạt chế độ khách.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#16191E] border border-[#2D333B] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Decorator */}
        <div className="px-6 pt-6 pb-4 border-b border-[#262A30] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                {mode === 'signin' ? 'Đăng Nhập Tài Khoản' : 'Đăng Ký Thành Viên Mới'}
              </h3>
              <p className="text-xs text-slate-400">
                {mode === 'signin'
                  ? 'Đồng bộ tiến độ từ vựng & Speaking AI trên mọi thiết bị'
                  : 'Thiết lập lộ trình học cá nhân hóa chuẩn Cambridge'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#21262E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#121418] border border-[#262A30]">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                sounds.playClick();
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                sounds.playClick();
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Đăng Ký & Cá Nhân Hóa
            </button>
          </div>
        </div>

        {/* Form Body (Scrollable) */}
        <div className="px-6 py-4 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google Sign-in Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-2xl bg-[#21262E] hover:bg-[#2A313C] border border-[#363D47] text-white text-xs font-bold flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm hover:scale-[1.01] active:scale-[0.99]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.5 0 2.8.5 3.8 1.4l2.8-2.8C16.8 1.9 14.5 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.4 2.6C6.2 6.9 8.9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.3 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.6C.7 10 0 11.4 0 12.5s.7 2.5 1.9 4.9l3.4-2.6z"
              />
              <path
                fill="#34A853"
                d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-1.9-6.7-4.6L1.9 16.8C3.7 20.4 7.5 23.5 12 23.5z"
              />
            </svg>
            <span>Tiếp tục với Google</span>
          </button>

          <div className="flex items-center gap-3 my-2">
            <div className="h-px bg-[#262A30] flex-1" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              hoặc tài khoản email
            </span>
            <div className="h-px bg-[#262A30] flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Display Name (Only on Sign Up) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Họ tên hoặc Biệt danh <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="VD: Alex Nguyen, Linh Dan..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#121418] border border-[#2D333B] text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Địa chỉ Email <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#121418] border border-[#2D333B] text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Mật khẩu <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#121418] border border-[#2D333B] text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* PERSONALIZATION ONBOARDING FIELDS (Only on Sign Up) */}
            {mode === 'signup' && (
              <div className="pt-2 border-t border-[#262A30] space-y-3.5 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-indigo-300">
                    Cá nhân hóa hồ sơ học tập của bạn
                  </span>
                </div>

                {/* Target Band & Current Band */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Band hiện tại
                    </label>
                    <select
                      value={currentBand}
                      onChange={(e) => setCurrentBand(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[#121418] border border-[#2D333B] text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value={5.0}>Band 5.0 (Cơ bản)</option>
                      <option value={5.5}>Band 5.5 (Trung bình)</option>
                      <option value={6.0}>Band 6.0 (Khá)</option>
                      <option value={6.5}>Band 6.5 (Tốt)</option>
                      <option value={7.0}>Band 7.0 (Thành thạo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-indigo-300 uppercase mb-1">
                      Mục tiêu (Target) 🎯
                    </label>
                    <select
                      value={targetBand}
                      onChange={(e) => setTargetBand(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-indigo-950/40 border border-indigo-500/50 text-xs font-extrabold text-indigo-300 focus:outline-none focus:border-indigo-400"
                    >
                      <option value={6.5}>Band 6.5</option>
                      <option value={7.0}>Band 7.0</option>
                      <option value={7.5}>Band 7.5 (Phổ biến)</option>
                      <option value={8.0}>Band 8.0 (Xuất sắc)</option>
                      <option value={8.5}>Band 8.5+</option>
                    </select>
                  </div>
                </div>

                {/* Study Goal */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                    Mục đích chính của bạn
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'study_abroad', label: '✈️ Du học ĐH/ThS' },
                      { id: 'immigration', label: '🌍 Định cư nước ngoài' },
                      { id: 'work_career', label: '💼 Đi làm & Thăng tiến' },
                      { id: 'graduation', label: '🎓 Tốt nghiệp Đại học' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setStudyGoal(item.id as StudyGoal)}
                        className={`p-2 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                          studyGoal === item.id
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-[#121418] border-[#2D333B] text-slate-400 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Daily Study Budget & Target Exam Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Thời gian học/ngày
                    </label>
                    <select
                      value={dailyBudget}
                      onChange={(e) => setDailyBudget(parseInt(e.target.value, 10) as DailyTimeBudget)}
                      className="w-full px-3 py-2 rounded-xl bg-[#121418] border border-[#2D333B] text-xs font-bold text-white focus:outline-none"
                    >
                      <option value={15}>15 phút (Cấp tốc)</option>
                      <option value={30}>30 phút (Chuẩn)</option>
                      <option value={45}>45 phút (Nâng cao)</option>
                      <option value={60}>60+ phút (Chuyên sâu)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Ngày thi dự kiến
                    </label>
                    <input
                      type="date"
                      value={targetExamDate}
                      onChange={(e) => setTargetExamDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#121418] border border-[#2D333B] text-xs font-medium text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:opacity-95 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Đăng Nhập Ngay' : 'Hoàn Tất Đăng Ký'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer: Guest Mode */}
        <div className="px-6 py-3.5 bg-[#121418] border-t border-[#262A30] flex items-center justify-between">
          <button
            type="button"
            onClick={handleGuestSignIn}
            className="text-xs text-slate-400 hover:text-indigo-300 font-semibold transition-colors cursor-pointer"
          >
            🚀 Trải nghiệm trước (Chế độ Khách)
          </button>
          <span className="text-[10px] text-slate-500">Bảo mật chuẩn Firebase Auth</span>
        </div>
      </div>
    </div>
  );
};
