'use client'
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { CircleCheck, CircleAlert } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { getLocaleFromPath } from '@/utils/getLocaleFromPath'
import FadeInView from '@/components/Reusable/FadeInView'

const Notification = ({ type, text, onClose }) => {
    const messageText = typeof text === 'string' ? text : JSON.stringify(text);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (onClose) onClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <FadeInView
            direction="top"
            duration={300}
            distance={10}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-md mb-4 text-sm font-medium text-center mx-auto w-full max-w-lg
                ${type === "error"
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
        >
            <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs
                    ${type === "error" ? "bg-red-500" : "bg-green-500"}`}
            >
                {type === "error" ? <CircleAlert size={12} /> : <CircleCheck size={12} />}
            </div>
            <p>{messageText}</p>
        </FadeInView>
    );
}

const initialFormData = {
    userType: '',
    firstName: '',
    lastName: '',
    companyName: '',
    nrFiscal: '',
    country: '',
    city: '',
    address: '',
    alternativeAddress: '',
    email: '',
    phone: '',
}

export default function AnfrageFormProduct({ onBack }) {
    const { cartItems, clearCart } = useCart()
    const [formData, setFormData] = useState(initialFormData)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)
    const t = useTranslations('enquiry')
    const router = useRouter()
    const pathname = usePathname();
    const locale = getLocaleFromPath(pathname);

    const fieldLabels = {
        userType: t('fields.userType'),
        firstName: t('fields.firstName'),
        lastName: t('fields.lastName'),
        companyName: t('fields.companyName'),
        nrFiscal: t('fields.taxNumber'),
        country: t('fields.country'),
        city: t('fields.city'),
        address: t('fields.address'),
        email: t('fields.email'),
        phone: t('fields.phone'),
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const validateForm = () => {
        const requiredFields = [
            'firstName', 'lastName', 'email', 'phone',
            'country', 'city', 'address', 'userType'
        ]

        if (formData.userType === 'Geschäft') {
            requiredFields.push('companyName', 'nrFiscal')
        }

        const missingFields = requiredFields.filter(field => !formData[field]);
        if (missingFields.length > 0) {
            const missingLabels = missingFields.map(f => fieldLabels[f]).join(', ');
            setMessage({
                type: 'error',
                text: t('error.requiredFields', { fields: missingLabels })
            });
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
            setMessage({ type: 'error', text: t('error.invalidEmail') });
            return false;
        }

        if (!formData.phone || formData.phone.length < 5) {
            setMessage({ type: 'error', text: t('error.invalidPhone') });
            return false;
        }

        return true
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        if (!validateForm()) {
            setLoading(false)
            return
        }

        const payload = {
            anfrage_type: formData.userType,
            anfrage_vorname: formData.firstName,
            anfrage_nachname: formData.lastName,
            anfrage_email: formData.email,
            anfrage_phone: formData.phone,
            anfrage_country: formData.country,
            anfrage_city: formData.city,
            anfrage_address: formData.address,
            anfrage_beschreibung: formData.alternativeAddress || '',
            ...(formData.userType === 'Geschäft' && {
                anfrage_company: formData.companyName,
                anfrage_fiscal_number: formData.nrFiscal,
            }),
            produkte: cartItems.map(item => item.produkte_id)
        }

        try {
            const response = await fetch('/api/anfrage_produkt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            const result = await response.json()

            if (!response.ok || !result.success) {
                const errMsg = typeof result.error === 'string'
                    ? result.error
                    : result.message || t('error.apiFailed');
                throw new Error(errMsg);
            }

            const successMsg = typeof result.message === 'string'
                ? result.message
                : result.message?.message || t('success.submitted');

            setMessage({
                type: 'success',
                text: successMsg
            });

            clearCart()
            setFormData(initialFormData)

            setTimeout(() => {
                router.push(`/${locale}/produkte`);
            }, 1500);

        } catch (error) {
            console.error("Submit error:", error);
            setMessage({
                type: 'error',
                text: error.message || t('error.submitFailed')
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <FadeInView
            direction="right"
            duration={500}
            distance={30}
            className="max-w-7xl mx-auto p-6 bg-white"
        >
            <button
                onClick={onBack}
                className="mb-6 text-sm text-gray-600 hover:text-[#d1b250] cursor-pointer"
            >
                {t('backToWishlist')}
            </button>

            {/* Show notification without AnimatePresence */}
            {message && (
                <Notification
                    type={message.type}
                    text={message.text}
                    onClose={() => setMessage(null)}
                />
            )}

            {cartItems.length > 0 && (
                <FadeInView
                    direction="bottom"
                    duration={400}
                    distance={20}
                    className="mb-6"
                >
                    <p className="font-medium mb-4 text-gray-800">{t('productsInRequest')}:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cartItems.map((item, idx) => (
                            <FadeInView
                                key={`${item.id}-${idx}`}
                                direction="bottom"
                                duration={400}
                                distance={15}
                                delay={idx * 100}
                                className="flex items-center p-2 bg-white rounded-lg border border-yellow-300 shadow-sm hover:shadow-md transition-shadow duration-200"
                            >
                                <div className="shrink-0 w-20 h-20 overflow-hidden mr-4">
                                    {item.image ? (
                                        <Image
                                            src={`/cms${item.image}`}
                                            alt={item.name || "Product image"}
                                            width={80}
                                            height={80}
                                            className=" object-center rounded-md bg-gray-100"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                                            <span className="text-gray-400">{t('noImage')}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="grow">
                                    <h3 className="font-medium text-gray-900 text-base mb-2 uppercase">
                                        {item.name}
                                    </h3>
                                    <div className="flex flex-col space-y-1">
                                        {item.category && (
                                            <span className="text-sm text-[#d1b250] font-normal">
                                                {item.category}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </FadeInView>
                        ))}
                    </div>
                </FadeInView>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <FadeInView
                    direction="bottom"
                    duration={400}
                    distance={20}
                    delay={100}
                >
                    <p className="text-gray-700 mb-3 font-medium"> {t('buyingAs')}</p>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => handleInputChange('userType', 'Person')}
                            className={`px-10 py-2 rounded-full border-2 font-medium transition-all cursor-pointer ${formData.userType === 'Person'
                                ? 'bg-orange-50 border-orange-300 text-orange-600'
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                        >
                            {t('person')}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleInputChange('userType', 'Geschäft')}
                            className={`px-10 py-2 rounded-full border-2 font-medium transition-all cursor-pointer ${formData.userType === 'Geschäft'
                                ? 'bg-orange-50 border-orange-300 text-orange-600'
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                        >
                            {t('business')}
                        </button>
                    </div>
                </FadeInView>

                {formData.userType === 'Geschäft' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FadeInView
                            direction="bottom"
                            duration={400}
                            distance={20}
                            delay={150}
                        >
                            <label className="block text-gray-700 font-medium mb-2">
                                {t('companyName')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.companyName}
                                onChange={(e) => handleInputChange('companyName', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
                                required={formData.userType === 'Geschäft'}
                            />
                        </FadeInView>
                        <FadeInView
                            direction="bottom"
                            duration={400}
                            distance={20}
                            delay={200}
                        >
                            <label className="block text-gray-700 font-medium mb-2">
                                {t('taxNumber')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.nrFiscal}
                                onChange={(e) => handleInputChange('nrFiscal', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
                                required={formData.userType === 'Geschäft'}
                            />
                        </FadeInView>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FadeInView
                        direction="bottom"
                        duration={400}
                        distance={20}
                        delay={250}
                    >
                        <label className="block text-gray-700 font-medium mb-2">
                            {t('firstName')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
                            required
                        />
                    </FadeInView>
                    <FadeInView
                        direction="bottom"
                        duration={400}
                        distance={20}
                        delay={300}
                    >
                        <label className="block text-gray-700 font-medium mb-2">
                            {t('lastName')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
                            required
                        />
                    </FadeInView>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FadeInView
                        direction="bottom"
                        duration={400}
                        distance={20}
                        delay={350}
                    >
                        <label className="block text-gray-700 font-medium mb-2">
                            {t('country')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.country}
                            onChange={(e) => handleInputChange('country', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
                            required
                        />
                    </FadeInView>
                    <FadeInView
                        direction="bottom"
                        duration={400}
                        distance={20}
                        delay={400}
                    >
                        <label className="block text-gray-700 font-medium mb-2">
                            {t('city')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
                            required
                        />
                    </FadeInView>
                </div>

                <FadeInView
                    direction="bottom"
                    duration={400}
                    distance={20}
                    delay={450}
                >
                    <label className="block text-gray-700 font-medium mb-2">
                        {t('address')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
                            required
                        />
                        <CircleCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                    </div>
                </FadeInView>

                <FadeInView
                    direction="bottom"
                    duration={400}
                    distance={20}
                    delay={500}
                >
                    <label className="block text-gray-600 mb-2">
                        {t('description')}
                    </label>
                    <input
                        type="text"
                        value={formData.alternativeAddress}
                        onChange={(e) =>
                            handleInputChange('alternativeAddress', e.target.value)
                        }
                        placeholder={t('description')}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all placeholder-gray-400"
                    />
                </FadeInView>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FadeInView
                        direction="bottom"
                        duration={400}
                        distance={20}
                        delay={550}
                    >
                        <label className="block text-gray-700 font-medium mb-2">
                            {t('email')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
                            required
                        />
                    </FadeInView>
                    <FadeInView
                        direction="bottom"
                        duration={400}
                        distance={20}
                        delay={600}
                    >
                        <label className="block text-gray-700 font-medium mb-2">
                            {t('phone')} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
                                required
                            />
                            <CircleCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                        </div>
                    </FadeInView>
                </div>

                <FadeInView
                    direction="bottom"
                    duration={400}
                    distance={20}
                    delay={650}
                    className="flex justify-center"
                >
                    <button type="submit" disabled={loading} className="group w-[40%] p-2.5 h-11.25 bg-transparent text-[#30373e] relative overflow-hidden text-[13px] tracking-normal font-medium uppercase transition-all duration-500 ease-in-out cursor-pointer border-2 border-[#d1b250] flex items-center justify-center rounded-[3px]">
                        <span className="w-full h-full absolute left-0 top-0 z-1"></span>
                        <p className="margin-0 relative z-2 inline-flex items-center gap-2 text-black">
                            {loading ? t('sending') : t('sendMessage')}
                            <svg
                                className="ml-2 w-4 h-4 transition-transform duration-300 ease-in group-hover:translate-x-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                                />
                            </svg>
                        </p>
                    </button>
                </FadeInView>
            </form>
        </FadeInView>
    )
}