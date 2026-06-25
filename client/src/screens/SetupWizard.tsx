import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSpaceStore } from '../store/spaceStore';

interface CourseInput {
  name: string;
  code: string;
}

export function SetupWizard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createSpace } = useSpaceStore();

  const [step, setStep] = useState(1);
  const [name, setName] = useState(user?.name || '');
  const [dept, setDept] = useState('Production Engineering');
  const [level, setLevel] = useState('300 Level');
  const [uni, setUni] = useState('University of Benin (UNIBEN)');
  const suggested: CourseInput[] = [
    { name: 'Fluid Mechanics I', code: 'PEG 301' },
    { name: 'Thermodynamics II', code: 'PEG 303' },
    { name: 'Manufacturing Processes I', code: 'PEG 305' },
    { name: 'Engineering Materials', code: 'MME 302' },
    { name: 'Engineering Mathematics III', code: 'MTH 301' },
  ];
  const [courses, setCourses] = useState<CourseInput[]>(suggested);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const icons = ['💧', '🔥', '⚙️', '∑', '✍️', '📐', '🔬', '💡', '🖥️', '🏗️'];
  const colIndices = [0, 1, 2, 3, 4, 0, 1, 2, 3, 4];

  const addCourse = () => setCourses([...courses, { name: '', code: '' }]);
  const removeCourse = (i: number) => setCourses(courses.filter((_, idx) => idx !== i));
  const updateCourse = (i: number, field: keyof CourseInput, value: string) => {
    const updated = [...courses];
    updated[i] = { ...updated[i], [field]: value };
    setCourses(updated);
  };

  const handleCreate = async () => {
    if (!name || !dept || !level || !uni) {
      setError('Please fill in all fields');
      return;
    }

    const validCourses = courses.filter((c) => c.name && c.code);
    if (validCourses.length === 0) {
      setError('Add at least one course');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const courseData = validCourses.map((c, i) => ({
        name: c.name,
        code: c.code,
        icon: icons[i % icons.length],
        color_index: colIndices[i % colIndices.length],
      }));

      await createSpace({ name: `${level} ${dept}`, dept, level, uni, courses: courseData });
      navigate('/home');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create space');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col px-6 py-8">
      {/* Progress bar */}
      <div className="flex gap-1.5 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              s <= step ? 'bg-app-accent' : 'bg-app-border'
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="flex-1 flex flex-col max-w-sm mx-auto w-full animate-fadeIn">
          <h2 className="text-xl font-syne font-bold text-app-text mb-1">Your Class Info</h2>
          <p className="text-app-text-dim text-sm font-dm mb-6">Set up your space</p>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-app-text-dim text-xs font-syne font-semibold uppercase tracking-wider mb-1.5 block">Your Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
                className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-dm text-sm placeholder:text-app-text-faint focus:border-app-accent transition-colors" />
            </div>
            <div>
              <label className="text-app-text-dim text-xs font-syne font-semibold uppercase tracking-wider mb-1.5 block">Department</label>
              <input value={dept} onChange={(e) => setDept(e.target.value)} placeholder="e.g. Production Engineering"
                className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-dm text-sm placeholder:text-app-text-faint focus:border-app-accent transition-colors" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-app-text-dim text-xs font-syne font-semibold uppercase tracking-wider mb-1.5 block">Level</label>
                <select value={level} onChange={(e) => setLevel(e.target.value)}
                  className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-dm text-sm focus:border-app-accent transition-colors appearance-none">
                  {['100 Level', '200 Level', '300 Level', '400 Level', '500 Level'].map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-app-text-dim text-xs font-syne font-semibold uppercase tracking-wider mb-1.5 block">University</label>
                <input value={uni} onChange={(e) => setUni(e.target.value)}
                  className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-dm text-sm placeholder:text-app-text-faint focus:border-app-accent transition-colors" />
              </div>
            </div>
          </div>

          <button onClick={() => setStep(2)}
            className="w-full bg-app-accent text-app-bg font-syne font-bold text-sm rounded-xl py-3.5 mt-8 active:scale-[0.98] transition-all duration-200">
            Continue →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 flex flex-col max-w-sm mx-auto w-full animate-fadeIn">
          <h2 className="text-xl font-syne font-bold text-app-text mb-1">Your Courses</h2>
          <p className="text-app-text-dim text-sm font-dm mb-6">What courses does your class take?</p>

          <div className="flex flex-col gap-3 flex-1 overflow-y-auto scrollbar-none">
            {courses.map((course, i) => (
              <div key={i} className="flex gap-2 items-start bg-app-surface rounded-xl p-3 border border-app-border">
                <span className="text-lg mt-2.5">{icons[i % icons.length]}</span>
                <div className="flex-1 flex flex-col gap-2">
                  <input value={course.name} onChange={(e) => updateCourse(i, 'name', e.target.value)}
                    placeholder="Course name"
                    className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-2 text-app-text font-dm text-sm placeholder:text-app-text-faint focus:border-app-accent transition-colors" />
                  <input value={course.code} onChange={(e) => updateCourse(i, 'code', e.target.value)}
                    placeholder="Code (e.g. PEG 301)"
                    className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-2 text-app-text font-dm text-sm placeholder:text-app-text-faint focus:border-app-accent transition-colors" />
                </div>
                {courses.length > 1 && (
                  <button onClick={() => removeCourse(i)} className="text-app-red text-lg mt-2 px-1">×</button>
                )}
              </div>
            ))}
            <button onClick={addCourse} className="text-app-accent text-sm font-syne font-semibold py-2 text-center">
              + Add another course
            </button>
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={() => setStep(1)}
              className="flex-1 bg-app-surface border border-app-border text-app-text font-syne font-semibold text-sm rounded-xl py-3.5 active:scale-[0.98] transition-all duration-200">
              ← Back
            </button>
            <button onClick={handleCreate} disabled={loading}
              className="flex-[2] bg-app-accent text-app-bg font-syne font-bold text-sm rounded-xl py-3.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Space →'}
            </button>
          </div>
          {error && <p className="text-app-red text-sm font-dm text-center mt-2">{error}</p>}
        </div>
      )}
    </div>
  );
}
