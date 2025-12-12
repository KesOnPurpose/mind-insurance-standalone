// Email Collection Step for External Assessment
// Collects name and email before showing results

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, User, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MENTAL_PILLAR_COLORS } from '@/types/mental-pillar-assessment';

interface EmailCollectionStepProps {
  onSubmit: (email: string, name: string) => Promise<void>;
  isSubmitting: boolean;
  emailError?: string | null;
  nameError?: string | null;
}

export function EmailCollectionStep({
  onSubmit,
  isSubmitting,
  emailError,
  nameError,
}: EmailCollectionStepProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(email.trim(), name.trim());
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: `linear-gradient(135deg, ${MENTAL_PILLAR_COLORS.background.start} 0%, ${MENTAL_PILLAR_COLORS.background.end} 100%)`,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: `${MENTAL_PILLAR_COLORS.primary}20` }}
          >
            <Mail
              className="w-8 h-8"
              style={{ color: MENTAL_PILLAR_COLORS.primary }}
            />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Almost There!
          </h2>
          <p className="text-white/60">
            Enter your details to see your Mental Pillar results
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white/80 text-sm">
              Your Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500/50 focus:ring-violet-500/20"
              />
            </div>
            {nameError && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-red-400 text-sm"
              >
                {nameError}
              </motion.p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/80 text-sm">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500/50 focus:ring-violet-500/20"
              />
            </div>
            {emailError && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-red-400 text-sm"
              >
                {emailError}
              </motion.p>
            )}
          </div>

          {/* Privacy Note */}
          <p className="text-white/40 text-xs text-center">
            We'll use this to save your results and connect you to the Mind Insurance app.
          </p>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || !name.trim() || !email.trim()}
            className="w-full py-6 text-lg font-semibold"
            style={{
              background:
                !isSubmitting && name.trim() && email.trim()
                  ? `linear-gradient(135deg, ${MENTAL_PILLAR_COLORS.primary} 0%, ${MENTAL_PILLAR_COLORS.primaryLight} 100%)`
                  : undefined,
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Results...
              </>
            ) : (
              <>
                See My Results
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </motion.form>

        {/* Completion Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
            }}
          >
            <span className="text-lg">✓</span>
            Assessment Complete
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
