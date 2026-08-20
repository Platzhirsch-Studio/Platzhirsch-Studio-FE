"use client";
import { useState, useEffect } from "react";
import { User, Mail, Phone, History, FileUp, CircleCheck } from "lucide-react";
import SinglePageBanner from "@/components/Reusable/singlePageSlider";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import FadeInView from "@/components/Reusable/FadeInView";

// Import react-share components and icons
import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  WhatsappShareButton,
  EmailShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  WhatsappIcon,
  EmailIcon,
} from "react-share";

const Notification = ({ type, text, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <FadeInView
      as="div"
      direction="top"
      duration={300}
      distance={10}
      className={`flex items-center gap-2 px-4 py-3 rounded-md mb-4 ${type === "error"
          ? "bg-red-100 text-red-800"
          : "bg-green-100 text-green-800"
        }`}
    >
      <CircleCheck />
      <span>{text}</span>
    </FadeInView>
  );
};

const JobDetailsClient = ({ job }) => {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = useTranslations("JobsDetails");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    text: "",
    phone: "",
  });
  const [file, setFile] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileError, setFileError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setFileError("Please upload PDF files only");
        setFile(null);
        e.target.value = "";
      } else {
        setFile(selectedFile);
        setFileError(null);
      }
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Please enter your name");
      return false;
    }
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!formData.phone.trim()) {
      setError("Please enter your phone number");
      return false;
    }
    if (!formData.text.trim()) {
      setError("Please enter a message");
      return false;
    }
    if (!file) {
      setError("Please upload your CV");
      return false;
    }
    return true;
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    // Simulate API call for demonstration
    try {
      // In a real application, you'd send formData and file here
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate network request
      setShowSuccess(true);
      setFormData({
        name: "",
        email: "",
        text: "",
        phone: "",
      });
      setFile(null);
      document.getElementById("file-upload").value = "";
    } catch (err) {
      setError(err.message || "An error occurred. Please try again later.");
    } finally {
      setLoading(false);
      setTimeout(() => {
        setShowSuccess(false);
        setError(null);
      }, 5000);
    }
  };

  const formattedDate = job?.posted
    ? new Date(job.posted).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    : "Unknown";
  const formattedDateCreation = job?.creation
    ? new Date(job.creation).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    : "Unknown";

  // Helper function to get localized content or default to German
  const getLocalizedContent = (field) => {
    const localizedField = job?.[`${field}_${locale}`];
    if (localizedField && localizedField.length > 0) return localizedField;
    return job?.[`${field}_de`] || []; // Fallback to German if localized is empty
  };

  const getLocalizedText = (field) => {
    const localizedText = job?.[`${field}_${locale}`];
    // Check if the localized field exists and is not null/undefined
    if (localizedText !== null && localizedText !== undefined && localizedText.trim() !== "") {
      return localizedText;
    }
    // Fallback to German
    const germanText = job?.[`${field}_de`];
    if (germanText !== null && germanText !== undefined && germanText.trim() !== "") {
      return germanText;
    }
    return ""; // Return empty string if no content found
  };

  const linkNameOne =
    locale === "it" ? "SU DI NOI" : locale === "en" ? "ABOUT US" : locale === "fr" ? "À PROPOS" : "ABOUT US";
  const linkNameTwo =
    locale === "it" ? "Carriera" : locale === "en" ? "Career" : locale === "fr" ? "Carrière" : "Career";
  const Home = locale === "it" ? "Casa " : locale === "en" ? "Home" : locale === "fr" ? "Accueil" : "Home";

  const BannerInfo = {
    image: "/Images/Arbeiten/bannerImageArbeiten1.jpg",
    links: [
      { linkName: Home, link: "/" },
      { linkName: linkNameOne },
      { linkName: linkNameTwo, link: "/about-us/career" },
      { linkName: job.title, link: `/about-us/career/${job.slug}` },
    ],
    title: job.title,
  };

  // Get dynamic content based on locale
  const jobDescription = getLocalizedText("jobs_description");
  const responsibilities = getLocalizedContent("responsibilities");
  const requirements = getLocalizedContent("requirement");
  const workingHours = getLocalizedContent("working_hours");
  const benefits = getLocalizedContent("benefits");
  const statement = getLocalizedText("statement");
  const jobStatus = getLocalizedText("job_status");
  const keywords = getLocalizedText("keywords");

  // For Summary data, using dynamic values where available, static otherwise
  const summaryData = {
    [t("jobType")]: jobStatus || "N/A",
    [t("category")]: job?.[`category_${locale}`],
    [t("posted")]: formattedDateCreation,
    [t("salary")]: job.salary ? `$${job.salary} / ${t("monthly")}` : "N/A",
    [t("experience")]: `${job?.experience} ${t("years")}`,
    [t("application_end")]: formattedDate,
  };

  // Get current page URL for sharing
  const currentPageUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <>

      <SinglePageBanner info={BannerInfo} />

      <div className="max-w-7xl mx-auto px-4 mt-10 lg:mt-16 mb-10 lg:mb-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2">
          {/* Description */}
          {jobDescription && (
            <FadeInView
              as="div"
              direction="bottom"
              duration={500}
              distance={20}
              className="mb-8"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-2">{t("description")}</h2>
              <p className="whitespace-pre-line text-gray-700 text-sm leading-relaxed">{jobDescription}</p>
            </FadeInView>
          )}

          {/* Responsibilities */}
          {responsibilities.length > 0 && (
            <FadeInView
              as="div"
              direction="bottom"
              duration={500}
              distance={20}
              delay={100}
              className="mb-8"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-2">{t("Responsibilities")}</h2>
              <ul className="space-y-1 text-gray-700 text-sm">
                {responsibilities.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CircleCheck className="text-[#d1b250] text-sm mt-1" />
                    <span>{item.responsibility}</span>
                  </li>
                ))}
              </ul>
            </FadeInView>
          )}

          {/* Requirements */}
          {requirements.length > 0 && (
            <FadeInView
              as="div"
              direction="bottom"
              duration={500}
              distance={20}
              delay={200}
              className="mb-8"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-2"> {t("Requirements")} </h2>
              <ul className="space-y-1 text-gray-700 text-sm">
                {requirements.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CircleCheck className="text-[#d1b250] text-sm mt-1" />
                    <span>{item.anforderungen}</span>
                  </li>
                ))}
              </ul>
            </FadeInView>
          )}

          {/* Working Hours */}
          {workingHours.length > 0 && (
            <FadeInView
              as="div"
              direction="bottom"
              duration={500}
              distance={20}
              delay={300}
              className="mb-8"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-2">{t("workingHours")}</h2>
              <ul className="space-y-1 text-gray-700 text-sm">
                {workingHours.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <History className="text-[#d1b250] text-sm mt-1" />
                    <span>{item.working_hours}</span>
                  </li>
                ))}
              </ul>
            </FadeInView>
          )}

          {/* Benefits */}
          {benefits.length > 0 && (
            <FadeInView
              as="div"
              direction="bottom"
              duration={500}
              distance={20}
              delay={400}
              className="mb-8"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-2">{t("Benefits")}</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-gray-700 text-sm">
                {benefits.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CircleCheck className="text-[#d1b250] text-sm mt-1" />
                    <span>{item.benefit}</span>
                  </li>
                ))}
              </ul>
            </FadeInView>
          )}

          {/* Statement */}
          {statement && (
            <FadeInView
              as="div"
              direction="bottom"
              duration={500}
              distance={20}
              delay={500}
              className="mb-8"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-2">{t("statement")}</h2>
              <p className="whitespace-pre-line text-gray-700 text-sm leading-relaxed">{statement}</p>
            </FadeInView>
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-8">
          {/* Summary */}
          <FadeInView
            as="div"
            direction="bottom"
            duration={500}
            distance={20}
            delay={600}
            className="bg-white p-6 rounded-lg shadow-md border border-gray-100"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">{t("summary")}</h3>
            <div className="space-y-2 text-gray-700 text-sm">
              {Object.entries(summaryData).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center py-1 border-b border-gray-100">
                  <span className="font-medium">{key}:</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </FadeInView>

          {/* Share With */}
          <FadeInView
            as="div"
            direction="bottom"
            duration={500}
            distance={20}
            delay={700}
            className="bg-white p-6 rounded-lg shadow-md border border-gray-100"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">{t("shareWith")}</h3>
            <div className="flex justify-center gap-3">
              <FacebookShareButton url={currentPageUrl} quote={job.title} hashtag="#jobopening">
                <FacebookIcon size={32} round />
              </FacebookShareButton>
              <TwitterShareButton
                url={currentPageUrl}
                title={job.title}
                hashtags={keywords.split(",").map((tag) => tag.trim())}
              >
                <TwitterIcon size={32} round />
              </TwitterShareButton>
              <LinkedinShareButton url={currentPageUrl} title={job.title} summary={jobDescription}>
                <LinkedinIcon size={32} round />
              </LinkedinShareButton>
              <WhatsappShareButton url={currentPageUrl} title={job.title}>
                <WhatsappIcon size={32} round />
              </WhatsappShareButton>
              <EmailShareButton
                url={currentPageUrl}
                subject={`Job Opening: ${job.title}`}
                body={`Check out this job opening: ${currentPageUrl}`}
              >
                <EmailIcon size={32} round />
              </EmailShareButton>
            </div>
          </FadeInView>

          {/* Apply Form */}
          <FadeInView
            as="div"
            direction="bottom"
            duration={500}
            distance={30}
            delay={800}
            className="bg-white border border-gray-200 p-6 pb-0 rounded-lg shadow-md"
          >
            <h3 className="text-2xl font-semibold mb-4 text-[#1f1f1f]">{t("applyNow")}</h3>

            {/* Notifications */}
            {showSuccess && (
              <Notification
                type="success"
                text={t("applySuccess")}
                onClose={() => setShowSuccess(false)}
              />
            )}
            {error && (
              <Notification
                type="error"
                text={error}
                onClose={() => setError(null)}
              />
            )}

            <form onSubmit={handleApply} className="space-y-4 py-4">
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded px-3 py-2">
                <User className="text-gray-500" />
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full outline-none bg-transparent text-[16px]"
                />
              </div>
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded px-3 py-2">
                <Mail className="text-gray-500" />
                <input
                  type="email"
                  name="email"
                  placeholder="Your Email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full outline-none bg-transparent text-[16px]"
                />
              </div>
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded px-3 py-2">
                <Phone className="text-gray-500" />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Your Phone Number"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full outline-none bg-transparent text-[16px]"
                />
              </div>
              <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded px-3 py-2">
                <textarea
                  name="text"
                  rows="4"
                  placeholder="Message or Motivation..."
                  required
                  value={formData.text}
                  onChange={handleChange}
                  className="w-full outline-none bg-transparent text-[16px]"
                />
              </div>
              <div className="relative inline-block">
                <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} accept=".pdf" />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-2 bg-[#d1b250] text-white px-4 py-2 rounded cursor-pointer hover:bg-[#c49f45] transition text-sm font-medium"
                >
                  <FileUp className="text-white" />
                  {file ? file.name : "Select CV (PDF only)"}
                </label>
                {fileError && <p className="text-red-500 text-sm mt-1">{fileError}</p>}
              </div>
              <div className="flex justify-center">
                <button type="submit" disabled={loading} className="group w-full p-2.5 h-11.25 bg-transparent text-[#30373e] relative overflow-hidden text-[13px] tracking-normal font-medium uppercase transition-all duration-500 ease-in-out cursor-pointer border-2 border-[#d1b250] flex items-center justify-center rounded-[3px]">
                  <span className="w-full h-full absolute left-0 top-0 z-1"></span>
                  <p className="margin-0 relative z-2 inline-flex items-center gap-2 text-black">
                    {loading ? (
                      "Submitting..."
                    ) : (
                      <>
                        Submit
                        <svg className="ml-2 w-4 h-4 transition-transform duration-300 ease-in group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                      </>
                    )}
                  </p>
                </button>
              </div>
            </form>
          </FadeInView>
        </div>
      </div>
    </>
  );
};

export default JobDetailsClient;