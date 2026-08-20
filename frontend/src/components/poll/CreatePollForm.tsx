'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { pollsApi } from '@/lib/api';
import { CATEGORIES } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface CreatePollFormProps {
  onSuccess?: () => void;
}

export function CreatePollForm({ onSuccess }: CreatePollFormProps) {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [category, setCategory] = useState('Other');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!question.trim()) errs.question = 'Question is required.';
    else if (question.trim().length < 5) errs.question = 'At least 5 characters.';
    else if (question.trim().length > 200) errs.question = 'Maximum 200 characters.';

    const filledOptions = options.filter((o) => o.trim());
    if (filledOptions.length < 2) errs.options = 'At least 2 options are required.';

    const lower = filledOptions.map((o) => o.trim().toLowerCase());
    if (new Set(lower).size !== lower.length) errs.options = 'Options must be unique.';

    options.forEach((o, i) => {
      if (o.trim() === '' && i < 2) errs[`option_${i}`] = 'This option cannot be empty.';
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const validOptions = options.filter((o) => o.trim());
    setSubmitting(true);
    try {
      const data = await pollsApi.create({
        question: question.trim(),
        options: validOptions,
        category,
      });
      toast.success('Poll published! 🎉');
      onSuccess?.();
      router.push(`/poll/${data.poll.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create poll.');
    } finally {
      setSubmitting(false);
    }
  };

  const addOption = () => {
    if (options.length < 4) setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Question */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Question <span className="text-red-400">*</span>
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask something interesting..."
          maxLength={200}
          rows={3}
          className={`textarea ${errors.question ? 'border-red-400 focus:ring-red-400' : ''}`}
        />
        <div className="flex justify-between mt-1">
          {errors.question
            ? <p className="text-xs text-red-500">{errors.question}</p>
            : <span />}
          <span className="text-xs text-gray-400">{question.length}/200</span>
        </div>
      </div>

      {/* Options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Options <span className="text-red-400">*</span>
          <span className="text-gray-400 font-normal ml-1">(2–4)</span>
        </label>
        <div className="space-y-2.5">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">
                {index + 1}
              </span>
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                maxLength={150}
                className={`input flex-1 ${errors[`option_${index}`] ? 'border-red-400' : ''}`}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="flex-shrink-0 p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                  aria-label={`Remove option ${index + 1}`}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        {errors.options && <p className="mt-1.5 text-xs text-red-500">{errors.options}</p>}
        {options.length < 4 && (
          <button
            type="button"
            onClick={addOption}
            className="mt-3 flex items-center gap-1.5 text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors"
          >
            <Plus size={16} />
            Add option
          </button>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input appearance-none"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <Button type="submit" loading={submitting} className="w-full" size="lg">
        {submitting ? 'Publishing...' : 'Publish Poll 🗳️'}
      </Button>
    </form>
  );
}
