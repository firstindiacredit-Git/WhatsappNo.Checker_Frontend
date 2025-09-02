import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Select from 'react-select';

const API_BASE_URL = "http://localhost:4000";

// Function to get country flag URL from flagsapi.com
const getFlagUrl = (countryCode) => {
    return `https://flagsapi.com/${countryCode.toUpperCase()}/shiny/64.png`;
};

// Custom Option component for the dropdown with flag image
const CustomOption = ({ innerProps, label, data, isSelected }) => (
    <div 
        {...innerProps} 
        className={`flex items-center gap-2 px-2 py-1 cursor-pointer text-sm h-8 ${
            isSelected ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-50'
        }`}
    >
        {data.flagUrl && (
            <img 
                src={data.flagUrl} 
                alt={`${data.label} flag`} 
                className="w-5 h-3 object-cover rounded-sm"
                loading="lazy"
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                }}
            />
        )}
        <span className="flex-1 truncate">{label}</span>
        {data.code && (
            <span className={`text-xs whitespace-nowrap ${
                isSelected ? 'text-white' : 'text-gray-500'
            }`}>
                +{data.code}
            </span>
        )}
    </div>
);

// Custom Single Value component for the selected option
const CustomSingleValue = ({ data }) => (
    <div className="flex items-center gap-2 w-full">
        {data.flagUrl && (
            <img 
                src={data.flagUrl} 
                alt={`${data.label} flag`} 
                className="w-5 h-3 object-cover rounded-sm"
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                }}
            />
        )}
        <span className="flex-1 truncate text-sm">{data.label}</span>
        {data.code && (
            <span className="text-gray-500 text-xs whitespace-nowrap">
                +{data.code}
            </span>
        )}
    </div>
);

// Custom styles for react-select
const customStyles = {
    control: (provided, state) => ({
        ...provided,
        border: state.isFocused ? '2px solid #4F46E5' : '1px solid #D1D5DB',
        boxShadow: 'none',
        '&:hover': {
            border: state.isFocused ? '2px solid #4F46E5' : '1px solid #4F46E5'
        },
        minHeight: '36px',
        height: '36px',
    }),
    valueContainer: (provided) => ({
        ...provided,
        height: '36px',
        padding: '0 6px',
    }),
    input: (provided) => ({
        ...provided,
        opacity: 0,
        height: '0px',
        padding: '0px',
        margin: '0px',
        position: 'absolute'
    }),
    indicatorsContainer: (provided) => ({
        ...provided,
        height: '36px',
    }),
    dropdownIndicator: (provided) => ({
        ...provided,
        padding: '4px',
    }),
    menu: (provided) => ({
        ...provided,
        maxHeight: '200px',
    }),
    menuList: (provided) => ({
        ...provided,
        maxHeight: '200px',
    }),
    option: (provided, state) => ({
        ...provided,
        display: 'flex',
        alignItems: 'center',
        padding: '4px 8px',
        cursor: 'pointer',
        fontSize: '13px',
        backgroundColor: state.isSelected ? '#4F46E5' : state.isFocused ? '#EEF2FF' : 'white',
        color: state.isSelected ? 'white' : '#374151',
        ':active': {
            backgroundColor: '#4F46E5',
            color: 'white'
        },
        height: '32px'
    }),
    singleValue: (provided) => ({
        ...provided,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        position: 'relative',
        transform: 'none',
        maxWidth: '100%'
    })
};

// Country options (same as NumberChecker)
const sortedCountries = [
    { value: 'AF', label: 'Afghanistan', code: '93', flagUrl: getFlagUrl('AF') },
    { value: 'AL', label: 'Albania', code: '355', flagUrl: getFlagUrl('AL') },
    { value: 'DZ', label: 'Algeria', code: '213', flagUrl: getFlagUrl('DZ') },
    { value: 'AS', label: 'American Samoa', code: '1684', flagUrl: getFlagUrl('AS') },
    { value: 'AD', label: 'Andorra', code: '376', flagUrl: getFlagUrl('AD') },
    { value: 'AO', label: 'Angola', code: '244', flagUrl: getFlagUrl('AO') },
    { value: 'AI', label: 'Anguilla', code: '1264', flagUrl: getFlagUrl('AI') },
    { value: 'AG', label: 'Antigua and Barbuda', code: '1268', flagUrl: getFlagUrl('AG') },
    { value: 'AR', label: 'Argentina', code: '54', flagUrl: getFlagUrl('AR') },
    { value: 'AM', label: 'Armenia', code: '374', flagUrl: getFlagUrl('AM') },
    { value: 'AW', label: 'Aruba', code: '297', flagUrl: getFlagUrl('AW') },
    { value: 'AU', label: 'Australia', code: '61', flagUrl: getFlagUrl('AU') },
    { value: 'AT', label: 'Austria', code: '43', flagUrl: getFlagUrl('AT') },
    { value: 'AZ', label: 'Azerbaijan', code: '994', flagUrl: getFlagUrl('AZ') },
    { value: 'BS', label: 'Bahamas', code: '1242', flagUrl: getFlagUrl('BS') },
    { value: 'BH', label: 'Bahrain', code: '973', flagUrl: getFlagUrl('BH') },
    { value: 'BD', label: 'Bangladesh', code: '880', flagUrl: getFlagUrl('BD') },
    { value: 'BB', label: 'Barbados', code: '1246', flagUrl: getFlagUrl('BB') },
    { value: 'BY', label: 'Belarus', code: '375', flagUrl: getFlagUrl('BY') },
    { value: 'BE', label: 'Belgium', code: '32', flagUrl: getFlagUrl('BE') },
    { value: 'BZ', label: 'Belize', code: '501', flagUrl: getFlagUrl('BZ') },
    { value: 'BJ', label: 'Benin', code: '229', flagUrl: getFlagUrl('BJ') },
    { value: 'BM', label: 'Bermuda', code: '1441', flagUrl: getFlagUrl('BM') },
    { value: 'BT', label: 'Bhutan', code: '975', flagUrl: getFlagUrl('BT') },
    { value: 'BO', label: 'Bolivia', code: '591', flagUrl: getFlagUrl('BO') },
    { value: 'BA', label: 'Bosnia and Herzegovina', code: '387', flagUrl: getFlagUrl('BA') },
    { value: 'BW', label: 'Botswana', code: '267', flagUrl: getFlagUrl('BW') },
    { value: 'BR', label: 'Brazil', code: '55', flagUrl: getFlagUrl('BR') },
    { value: 'BN', label: 'Brunei', code: '673', flagUrl: getFlagUrl('BN') },
    { value: 'BG', label: 'Bulgaria', code: '359', flagUrl: getFlagUrl('BG') },
    { value: 'BF', label: 'Burkina Faso', code: '226', flagUrl: getFlagUrl('BF') },
    { value: 'BI', label: 'Burundi', code: '257', flagUrl: getFlagUrl('BI') },
    { value: 'KH', label: 'Cambodia', code: '855', flagUrl: getFlagUrl('KH') },
    { value: 'CM', label: 'Cameroon', code: '237', flagUrl: getFlagUrl('CM') },
    { value: 'CA', label: 'Canada', code: '1', flagUrl: getFlagUrl('CA') },
    { value: 'CV', label: 'Cape Verde', code: '238', flagUrl: getFlagUrl('CV') },
    { value: 'KY', label: 'Cayman Islands', code: '1345', flagUrl: getFlagUrl('KY') },
    { value: 'CF', label: 'Central African Republic', code: '236', flagUrl: getFlagUrl('CF') },
    { value: 'TD', label: 'Chad', code: '235', flagUrl: getFlagUrl('TD') },
    { value: 'CL', label: 'Chile', code: '56', flagUrl: getFlagUrl('CL') },
    { value: 'CN', label: 'China', code: '86', flagUrl: getFlagUrl('CN') },
    { value: 'CO', label: 'Colombia', code: '57', flagUrl: getFlagUrl('CO') },
    { value: 'KM', label: 'Comoros', code: '269', flagUrl: getFlagUrl('KM') },
    { value: 'CG', label: 'Congo', code: '242', flagUrl: getFlagUrl('CG') },
    { value: 'CK', label: 'Cook Islands', code: '682', flagUrl: getFlagUrl('CK') },
    { value: 'CR', label: 'Costa Rica', code: '506', flagUrl: getFlagUrl('CR') },
    { value: 'HR', label: 'Croatia', code: '385', flagUrl: getFlagUrl('HR') },
    { value: 'CU', label: 'Cuba', code: '53', flagUrl: getFlagUrl('CU') },
    { value: 'CY', label: 'Cyprus', code: '357', flagUrl: getFlagUrl('CY') },
    { value: 'CZ', label: 'Czech Republic', code: '420', flagUrl: getFlagUrl('CZ') },
    { value: 'DK', label: 'Denmark', code: '45', flagUrl: getFlagUrl('DK') },
    { value: 'DJ', label: 'Djibouti', code: '253', flagUrl: getFlagUrl('DJ') },
    { value: 'DM', label: 'Dominica', code: '1767', flagUrl: getFlagUrl('DM') },
    { value: 'DO', label: 'Dominican Republic', code: '1809', flagUrl: getFlagUrl('DO') },
    { value: 'EC', label: 'Ecuador', code: '593', flagUrl: getFlagUrl('EC') },
    { value: 'EG', label: 'Egypt', code: '20', flagUrl: getFlagUrl('EG') },
    { value: 'SV', label: 'El Salvador', code: '503', flagUrl: getFlagUrl('SV') },
    { value: 'GQ', label: 'Equatorial Guinea', code: '240', flagUrl: getFlagUrl('GQ') },
    { value: 'ER', label: 'Eritrea', code: '291', flagUrl: getFlagUrl('ER') },
    { value: 'EE', label: 'Estonia', code: '372', flagUrl: getFlagUrl('EE') },
    { value: 'ET', label: 'Ethiopia', code: '251', flagUrl: getFlagUrl('ET') },
    { value: 'FK', label: 'Falkland Islands', code: '500', flagUrl: getFlagUrl('FK') },
    { value: 'FO', label: 'Faroe Islands', code: '298', flagUrl: getFlagUrl('FO') },
    { value: 'FJ', label: 'Fiji', code: '679', flagUrl: getFlagUrl('FJ') },
    { value: 'FI', label: 'Finland', code: '358', flagUrl: getFlagUrl('FI') },
    { value: 'FR', label: 'France', code: '33', flagUrl: getFlagUrl('FR') },
    { value: 'GF', label: 'French Guiana', code: '594', flagUrl: getFlagUrl('GF') },
    { value: 'PF', label: 'French Polynesia', code: '689', flagUrl: getFlagUrl('PF') },
    { value: 'GA', label: 'Gabon', code: '241', flagUrl: getFlagUrl('GA') },
    { value: 'GM', label: 'Gambia', code: '220', flagUrl: getFlagUrl('GM') },
    { value: 'GE', label: 'Georgia', code: '995', flagUrl: getFlagUrl('GE') },
    { value: 'DE', label: 'Germany', code: '49', flagUrl: getFlagUrl('DE') },
    { value: 'GH', label: 'Ghana', code: '233', flagUrl: getFlagUrl('GH') },
    { value: 'GI', label: 'Gibraltar', code: '350', flagUrl: getFlagUrl('GI') },
    { value: 'GR', label: 'Greece', code: '30', flagUrl: getFlagUrl('GR') },
    { value: 'GL', label: 'Greenland', code: '299', flagUrl: getFlagUrl('GL') },
    { value: 'GD', label: 'Grenada', code: '1473', flagUrl: getFlagUrl('GD') },
    { value: 'GP', label: 'Guadeloupe', code: '590', flagUrl: getFlagUrl('GP') },
    { value: 'GU', label: 'Guam', code: '1671', flagUrl: getFlagUrl('GU') },
    { value: 'GT', label: 'Guatemala', code: '502', flagUrl: getFlagUrl('GT') },
    { value: 'GN', label: 'Guinea', code: '224', flagUrl: getFlagUrl('GN') },
    { value: 'GW', label: 'Guinea-Bissau', code: '245', flagUrl: getFlagUrl('GW') },
    { value: 'GY', label: 'Guyana', code: '592', flagUrl: getFlagUrl('GY') },
    { value: 'HT', label: 'Haiti', code: '509', flagUrl: getFlagUrl('HT') },
    { value: 'HN', label: 'Honduras', code: '504', flagUrl: getFlagUrl('HN') },
    { value: 'HK', label: 'Hong Kong', code: '852', flagUrl: getFlagUrl('HK') },
    { value: 'HU', label: 'Hungary', code: '36', flagUrl: getFlagUrl('HU') },
    { value: 'IS', label: 'Iceland', code: '354', flagUrl: getFlagUrl('IS') },
    { value: 'IN', label: 'India', code: '91', flagUrl: getFlagUrl('IN') },
    { value: 'ID', label: 'Indonesia', code: '62', flagUrl: getFlagUrl('ID') },
    { value: 'IR', label: 'Iran', code: '98', flagUrl: getFlagUrl('IR') },
    { value: 'IQ', label: 'Iraq', code: '964', flagUrl: getFlagUrl('IQ') },
    { value: 'IE', label: 'Ireland', code: '353', flagUrl: getFlagUrl('IE') },
    { value: 'IL', label: 'Israel', code: '972', flagUrl: getFlagUrl('IL') },
    { value: 'IT', label: 'Italy', code: '39', flagUrl: getFlagUrl('IT') },
    { value: 'JM', label: 'Jamaica', code: '1876', flagUrl: getFlagUrl('JM') },
    { value: 'JP', label: 'Japan', code: '81', flagUrl: getFlagUrl('JP') },
    { value: 'JO', label: 'Jordan', code: '962', flagUrl: getFlagUrl('JO') },
    { value: 'KZ', label: 'Kazakhstan', code: '7', flagUrl: getFlagUrl('KZ') },
    { value: 'KE', label: 'Kenya', code: '254', flagUrl: getFlagUrl('KE') },
    { value: 'KI', label: 'Kiribati', code: '686', flagUrl: getFlagUrl('KI') },
    { value: 'KW', label: 'Kuwait', code: '965', flagUrl: getFlagUrl('KW') },
    { value: 'KG', label: 'Kyrgyzstan', code: '996', flagUrl: getFlagUrl('KG') },
    { value: 'LA', label: 'Laos', code: '856', flagUrl: getFlagUrl('LA') },
    { value: 'LV', label: 'Latvia', code: '371', flagUrl: getFlagUrl('LV') },
    { value: 'LB', label: 'Lebanon', code: '961', flagUrl: getFlagUrl('LB') },
    { value: 'LS', label: 'Lesotho', code: '266', flagUrl: getFlagUrl('LS') },
    { value: 'LR', label: 'Liberia', code: '231', flagUrl: getFlagUrl('LR') },
    { value: 'LY', label: 'Libya', code: '218', flagUrl: getFlagUrl('LY') },
    { value: 'LI', label: 'Liechtenstein', code: '423', flagUrl: getFlagUrl('LI') },
    { value: 'LT', label: 'Lithuania', code: '370', flagUrl: getFlagUrl('LT') },
    { value: 'LU', label: 'Luxembourg', code: '352', flagUrl: getFlagUrl('LU') },
    { value: 'MO', label: 'Macao', code: '853', flagUrl: getFlagUrl('MO') },
    { value: 'MK', label: 'Macedonia', code: '389', flagUrl: getFlagUrl('MK') },
    { value: 'MG', label: 'Madagascar', code: '261', flagUrl: getFlagUrl('MG') },
    { value: 'MW', label: 'Malawi', code: '265', flagUrl: getFlagUrl('MW') },
    { value: 'MY', label: 'Malaysia', code: '60', flagUrl: getFlagUrl('MY') },
    { value: 'MV', label: 'Maldives', code: '960', flagUrl: getFlagUrl('MV') },
    { value: 'ML', label: 'Mali', code: '223', flagUrl: getFlagUrl('ML') },
    { value: 'MT', label: 'Malta', code: '356', flagUrl: getFlagUrl('MT') },
    { value: 'MH', label: 'Marshall Islands', code: '692', flagUrl: getFlagUrl('MH') },
    { value: 'MQ', label: 'Martinique', code: '596', flagUrl: getFlagUrl('MQ') },
    { value: 'MR', label: 'Mauritania', code: '222', flagUrl: getFlagUrl('MR') },
    { value: 'MU', label: 'Mauritius', code: '230', flagUrl: getFlagUrl('MU') },
    { value: 'YT', label: 'Mayotte', code: '262', flagUrl: getFlagUrl('YT') },
    { value: 'MX', label: 'Mexico', code: '52', flagUrl: getFlagUrl('MX') },
    { value: 'FM', label: 'Micronesia', code: '691', flagUrl: getFlagUrl('FM') },
    { value: 'MD', label: 'Moldova', code: '373', flagUrl: getFlagUrl('MD') },
    { value: 'MC', label: 'Monaco', code: '377', flagUrl: getFlagUrl('MC') },
    { value: 'MN', label: 'Mongolia', code: '976', flagUrl: getFlagUrl('MN') },
    { value: 'ME', label: 'Montenegro', code: '382', flagUrl: getFlagUrl('ME') },
    { value: 'MS', label: 'Montserrat', code: '1664', flagUrl: getFlagUrl('MS') },
    { value: 'MA', label: 'Morocco', code: '212', flagUrl: getFlagUrl('MA') },
    { value: 'MZ', label: 'Mozambique', code: '258', flagUrl: getFlagUrl('MZ') },
    { value: 'MM', label: 'Myanmar', code: '95', flagUrl: getFlagUrl('MM') },
    { value: 'NA', label: 'Namibia', code: '264', flagUrl: getFlagUrl('NA') },
    { value: 'NR', label: 'Nauru', code: '674', flagUrl: getFlagUrl('NR') },
    { value: 'NP', label: 'Nepal', code: '977', flagUrl: getFlagUrl('NP') },
    { value: 'NL', label: 'Netherlands', code: '31', flagUrl: getFlagUrl('NL') },
    { value: 'NC', label: 'New Caledonia', code: '687', flagUrl: getFlagUrl('NC') },
    { value: 'NZ', label: 'New Zealand', code: '64', flagUrl: getFlagUrl('NZ') },
    { value: 'NI', label: 'Nicaragua', code: '505', flagUrl: getFlagUrl('NI') },
    { value: 'NE', label: 'Niger', code: '227', flagUrl: getFlagUrl('NE') },
    { value: 'NG', label: 'Nigeria', code: '234', flagUrl: getFlagUrl('NG') },
    { value: 'NU', label: 'Niue', code: '683', flagUrl: getFlagUrl('NU') },
    { value: 'NF', label: 'Norfolk Island', code: '672', flagUrl: getFlagUrl('NF') },
    { value: 'KP', label: 'North Korea', code: '850', flagUrl: getFlagUrl('KP') },
    { value: 'MP', label: 'Northern Mariana Islands', code: '1670', flagUrl: getFlagUrl('MP') },
    { value: 'NO', label: 'Norway', code: '47', flagUrl: getFlagUrl('NO') },
    { value: 'OM', label: 'Oman', code: '968', flagUrl: getFlagUrl('OM') },
    { value: 'PK', label: 'Pakistan', code: '92', flagUrl: getFlagUrl('PK') },
    { value: 'PW', label: 'Palau', code: '680', flagUrl: getFlagUrl('PW') },
    { value: 'PS', label: 'Palestine', code: '970', flagUrl: getFlagUrl('PS') },
    { value: 'PA', label: 'Panama', code: '507', flagUrl: getFlagUrl('PA') },
    { value: 'PG', label: 'Papua New Guinea', code: '675', flagUrl: getFlagUrl('PG') },
    { value: 'PY', label: 'Paraguay', code: '595', flagUrl: getFlagUrl('PY') },
    { value: 'PE', label: 'Peru', code: '51', flagUrl: getFlagUrl('PE') },
    { value: 'PH', label: 'Philippines', code: '63', flagUrl: getFlagUrl('PH') },
    { value: 'PN', label: 'Pitcairn', code: '64', flagUrl: getFlagUrl('PN') },
    { value: 'PL', label: 'Poland', code: '48', flagUrl: getFlagUrl('PL') },
    { value: 'PT', label: 'Portugal', code: '351', flagUrl: getFlagUrl('PT') },
    { value: 'PR', label: 'Puerto Rico', code: '1787', flagUrl: getFlagUrl('PR') },
    { value: 'QA', label: 'Qatar', code: '974', flagUrl: getFlagUrl('QA') },
    { value: 'RE', label: 'Reunion', code: '262', flagUrl: getFlagUrl('RE') },
    { value: 'RO', label: 'Romania', code: '40', flagUrl: getFlagUrl('RO') },
    { value: 'RU', label: 'Russia', code: '7', flagUrl: getFlagUrl('RU') },
    { value: 'RW', label: 'Rwanda', code: '250', flagUrl: getFlagUrl('RW') },
    { value: 'BL', label: 'Saint Barthelemy', code: '590', flagUrl: getFlagUrl('BL') },
    { value: 'WS', label: 'Samoa', code: '685', flagUrl: getFlagUrl('WS') },
    { value: 'SM', label: 'San Marino', code: '378', flagUrl: getFlagUrl('SM') },
    { value: 'SA', label: 'Saudi Arabia', code: '966', flagUrl: getFlagUrl('SA') },
    { value: 'SN', label: 'Senegal', code: '221', flagUrl: getFlagUrl('SN') },
    { value: 'RS', label: 'Serbia', code: '381', flagUrl: getFlagUrl('RS') },
    { value: 'SC', label: 'Seychelles', code: '248', flagUrl: getFlagUrl('SC') },
    { value: 'SL', label: 'Sierra Leone', code: '232', flagUrl: getFlagUrl('SL') },
    { value: 'SG', label: 'Singapore', code: '65', flagUrl: getFlagUrl('SG') },
    { value: 'SK', label: 'Slovakia', code: '421', flagUrl: getFlagUrl('SK') },
    { value: 'SI', label: 'Slovenia', code: '386', flagUrl: getFlagUrl('SI') },
    { value: 'SB', label: 'Solomon Islands', code: '677', flagUrl: getFlagUrl('SB') },
    { value: 'SO', label: 'Somalia', code: '252', flagUrl: getFlagUrl('SO') },
    { value: 'ZA', label: 'South Africa', code: '27', flagUrl: getFlagUrl('ZA') },
    { value: 'KR', label: 'South Korea', code: '82', flagUrl: getFlagUrl('KR') },
    { value: 'SS', label: 'South Sudan', code: '211', flagUrl: getFlagUrl('SS') },
    { value: 'ES', label: 'Spain', code: '34', flagUrl: getFlagUrl('ES') },
    { value: 'LK', label: 'Sri Lanka', code: '94', flagUrl: getFlagUrl('LK') },
    { value: 'SD', label: 'Sudan', code: '249', flagUrl: getFlagUrl('SD') },
    { value: 'SR', label: 'Suriname', code: '597', flagUrl: getFlagUrl('SR') },
    { value: 'SZ', label: 'Swaziland', code: '268', flagUrl: getFlagUrl('SZ') },
    { value: 'SE', label: 'Sweden', code: '46', flagUrl: getFlagUrl('SE') },
    { value: 'CH', label: 'Switzerland', code: '41', flagUrl: getFlagUrl('CH') },
    { value: 'SY', label: 'Syria', code: '963', flagUrl: getFlagUrl('SY') },
    { value: 'TW', label: 'Taiwan', code: '886', flagUrl: getFlagUrl('TW') },
    { value: 'TJ', label: 'Tajikistan', code: '992', flagUrl: getFlagUrl('TJ') },
    { value: 'TZ', label: 'Tanzania', code: '255', flagUrl: getFlagUrl('TZ') },
    { value: 'TH', label: 'Thailand', code: '66', flagUrl: getFlagUrl('TH') },
    { value: 'TL', label: 'Timor-Leste', code: '670', flagUrl: getFlagUrl('TL') },
    { value: 'TG', label: 'Togo', code: '228', flagUrl: getFlagUrl('TG') },
    { value: 'TK', label: 'Tokelau', code: '690', flagUrl: getFlagUrl('TK') },
    { value: 'TO', label: 'Tonga', code: '676', flagUrl: getFlagUrl('TO') },
    { value: 'TT', label: 'Trinidad and Tobago', code: '1868', flagUrl: getFlagUrl('TT') },
    { value: 'TN', label: 'Tunisia', code: '216', flagUrl: getFlagUrl('TN') },
    { value: 'TR', label: 'Turkey', code: '90', flagUrl: getFlagUrl('TR') },
    { value: 'TM', label: 'Turkmenistan', code: '993', flagUrl: getFlagUrl('TM') },
    { value: 'TC', label: 'Turks and Caicos Islands', code: '1649', flagUrl: getFlagUrl('TC') },
    { value: 'TV', label: 'Tuvalu', code: '688', flagUrl: getFlagUrl('TV') },
    { value: 'UG', label: 'Uganda', code: '256', flagUrl: getFlagUrl('UG') },
    { value: 'UA', label: 'Ukraine', code: '380', flagUrl: getFlagUrl('UA') },
    { value: 'AE', label: 'United Arab Emirates', code: '971', flagUrl: getFlagUrl('AE') },
    { value: 'GB', label: 'United Kingdom', code: '44', flagUrl: getFlagUrl('GB') },
    { value: 'US', label: 'United States', code: '1', flagUrl: getFlagUrl('US') },
    { value: 'UY', label: 'Uruguay', code: '598', flagUrl: getFlagUrl('UY') },
    { value: 'UZ', label: 'Uzbekistan', code: '998', flagUrl: getFlagUrl('UZ') },
    { value: 'VU', label: 'Vanuatu', code: '678', flagUrl: getFlagUrl('VU') },
    { value: 'VA', label: 'Vatican City', code: '379', flagUrl: getFlagUrl('VA') },
    { value: 'VE', label: 'Venezuela', code: '58', flagUrl: getFlagUrl('VE') },
    { value: 'VN', label: 'Vietnam', code: '84', flagUrl: getFlagUrl('VN') },
    { value: 'VG', label: 'Virgin Islands, British', code: '1284', flagUrl: getFlagUrl('VG') },
    { value: 'VI', label: 'Virgin Islands, U.S.', code: '1340', flagUrl: getFlagUrl('VI') },
    { value: 'WF', label: 'Wallis and Futuna', code: '681', flagUrl: getFlagUrl('WF') },
    { value: 'YE', label: 'Yemen', code: '967', flagUrl: getFlagUrl('YE') },
    { value: 'ZM', label: 'Zambia', code: '260', flagUrl: getFlagUrl('ZM') },
    { value: 'ZW', label: 'Zimbabwe', code: '263', flagUrl: getFlagUrl('ZW') },
].sort((a, b) => a.label.localeCompare(b.label));

// Then add 'All Countries' at the beginning
const COUNTRY_OPTIONS = [
    { value: 'all', label: 'All Countries', code: '' },
    ...sortedCountries
];

const MessageSender = () => {
    // Set default value to 'All Countries' option
    const [selectedCountry, setSelectedCountry] = useState(COUNTRY_OPTIONS[0]);
    const [numbers, setNumbers] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [fileUploadError, setFileUploadError] = useState(null);
    const [serverStatus, setServerStatus] = useState("unknown");
    const [messageResults, setMessageResults] = useState([]);
    const [sendingProgress, setSendingProgress] = useState({
        current: 0,
        total: 0,
        sent: 0,
        failed: 0,
        isActive: false
    });

    // Function to format phone numbers based on selected country
    const formatPhoneNumber = (number) => {
        // Remove all special characters and spaces
        let cleaned = number.replace(/[^\d]/g, '');
        
        // If "All Countries" is selected, assume it's India (+91) for 10-digit numbers
        if (selectedCountry.value === 'all') {
            // If number is 10 digits, add +91 (India)
            if (cleaned.length === 10) {
                return '+91' + cleaned;
            }
            // If number already has country code (11+ digits), add + prefix
            if (cleaned.length >= 11) {
                return '+' + cleaned;
            }
            return cleaned;
        }
        
        // If the number already starts with the country code, return as is
        if (cleaned.startsWith(selectedCountry.code)) {
            return '+' + cleaned;
        }
        
        // Add the selected country code with + prefix
        return '+' + selectedCountry.code + cleaned;
    };

    // Modified function to extract numbers from Excel
    const extractNumbersFromExcel = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    let extractedNumbers = [];
                    for (let row of jsonData) {
                        if (Array.isArray(row)) {
                            for (let cell of row) {
                                if (extractedNumbers.length >= 100) break; // Stop after 100 numbers
                                
                                const cellStr = String(cell);
                                if (/\d{10,}/.test(cellStr)) {
                                    const cleanedNumber = formatPhoneNumber(cellStr);
                                    if (cleanedNumber.length >= 12) {
                                        extractedNumbers.push(cleanedNumber);
                                    }
                                }
                            }
                        }
                        if (extractedNumbers.length >= 100) break;
                    }

                    resolve(extractedNumbers);
                } catch (err) {
                    reject(err);
                }
            };

            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        setFileUploadError(null);

        if (!file) return;

        const fileType = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(fileType)) {
            setFileUploadError("Please upload only an Excel or CSV file");
            return;
        }

        try {
            setIsLoading(true);
            const extractedNumbers = await extractNumbersFromExcel(file);

            if (extractedNumbers.length === 0) {
                setFileUploadError("No valid numbers found in the file");
                return;
            }

            setNumbers(extractedNumbers.join(', '));
            setStatus('Numbers loaded successfully from Excel!');
        } catch (err) {
            setFileUploadError("Error reading the file. Please upload a properly formatted file.");
        } finally {
            setIsLoading(false);
        }
    };

    // Drag and drop handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            const fileType = file.name.split('.').pop().toLowerCase();
            
            if (!['xlsx', 'xls', 'csv'].includes(fileType)) {
                setFileUploadError("Please upload only an Excel or CSV file");
                return;
            }

            try {
                setIsLoading(true);
                const extractedNumbers = await extractNumbersFromExcel(file);

                if (extractedNumbers.length === 0) {
                    setFileUploadError("No valid numbers found in the file");
                    return;
                }

                setNumbers(extractedNumbers.join(', '));
                setStatus('Numbers loaded successfully from Excel!');
            } catch (err) {
                setFileUploadError("Error reading the file. Please upload a properly formatted file.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus('');
        setMessageResults([]);

        const numberArray = numbers
            .split(',')
            .map(num => formatPhoneNumber(num.trim()))
            .filter(num => num.length >= 12 && num.startsWith('+'))
            .slice(0, 100);

        if (numberArray.length === 0) {
            setStatus('Error: Please enter valid phone numbers');
            setIsLoading(false);
            return;
        }

        // Initialize progress tracking
        setSendingProgress({
            current: 0,
            total: numberArray.length,
            sent: 0,
            failed: 0,
            isActive: true
        });

        try {
            // console.log('🚀 Starting to send messages to', numberArray.length, 'numbers');
            setStatus(`Starting to send messages to ${numberArray.length} numbers...`);

            // Add timeout and retry logic
            const sendWithRetry = async (retryCount = 0) => {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
                    
                    const response = await fetch(`${API_BASE_URL}/api/whatsapp/send`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            numbers: numberArray,
                            message: message
                        }),
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    return response;
                } catch (error) {
                    if (error.name === 'AbortError') {
                        throw new Error('Request timeout - server may be restarting');
                    }
                    throw error;
                }
            };

            let response;
            try {
                response = await sendWithRetry();
            } catch (error) {
                if (error.message.includes('timeout') || error.message.includes('Failed to fetch')) {
                    // console.log('⏳ Server may be restarting, waiting 5 seconds...');
                    setStatus('⏳ Server may be restarting, waiting 5 seconds...');
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    
                    // console.log('🔄 Retrying request...');
                    setStatus('🔄 Retrying request...');
                    response = await sendWithRetry(1);
                } else {
                    throw error;
                }
            }

            const data = await response.json();
            
            if (response.ok) {
                const totalSent = data.totalSent || 0;
                const totalFailed = data.totalFailed || 0;
                
                setStatus(`✅ Messages completed! ${totalSent} sent successfully, ${totalFailed} failed`);
                setMessageResults(data.results || []);
                
                // Update final progress
                setSendingProgress(prev => ({
                    ...prev,
                    current: numberArray.length,
                    sent: totalSent,
                    failed: totalFailed,
                    isActive: false
                }));
            } else {
                setStatus(`❌ Error: ${data.error || 'Unknown error occurred'}`);
                setSendingProgress(prev => ({ ...prev, isActive: false }));
            }
        } catch (error) {
            console.error('❌ Error sending messages:', error);
            
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                setStatus('❌ Server connection lost. Please check if server is running and try again.');
            } else if (error.message.includes('ERR_CONNECTION_RESET')) {
                setStatus('❌ Server restarted. Please wait a moment and try again.');
            } else {
                setStatus(`❌ Error: ${error.message || 'Unknown error occurred'}`);
            }
            
            setSendingProgress(prev => ({ ...prev, isActive: false }));
        } finally {
            setIsLoading(false);
        }
    };

    const checkServerStatus = async () => {
        try {
            const response = await fetch('http://localhost:4000/api/whatsapp/status');
            
            if (response.ok) {
                const data = await response.json();
                setServerStatus(data.connected ? "connected" : "disconnected");
                setStatus(null);
            } else {
                throw new Error('Server response not ok');
            }
        } catch (err) {
            console.error('Server status check error:', err);
            setServerStatus("disconnected");
            setStatus("Cannot connect to server. Please make sure the server is running.");
        }
    };

    useEffect(() => {
        checkServerStatus();
        const interval = setInterval(checkServerStatus, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full p-2 sm:p-4 bg-gray-50">
            {/* Header Section */}
            <div className="w-full max-w-5xl mb-2 sm:mb-4 text-center px-2">
                <div className="flex items-center justify-center mb-2">
                    <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-800">
                        WhatsApp Bulk Message Sender
                    </h1>
                </div>
                
                <p className="text-gray-600 max-w-4xl mx-auto text-xs sm:text-sm mb-2 sm:mb-4">
                    Send bulk WhatsApp messages efficiently. Enter numbers manually or upload from Excel files.
                </p>

                <div className="inline-flex items-center justify-center px-2 sm:px-3 py-1 rounded-full bg-gray-50 border border-gray-200 shadow-sm">
                    <div className={`w-2 h-2 rounded-full mr-1 sm:mr-2 ${
                        serverStatus === "connected" ? "bg-green-500 animate-pulse" : 
                        serverStatus === "disconnected" ? "bg-red-500" : "bg-yellow-500"
                    }`}></div>
                    <span className="text-xs font-medium text-gray-700">
                        {serverStatus === "connected" ? "Server Online" : 
                        serverStatus === "disconnected" ? "Server Offline" : "Connecting..."}
                    </span>
                </div>
            </div>
            
            <div className="w-full max-w-5xl relative">
                <div className="relative">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Left Column - Input Form */}
                        <div className="w-full lg:w-1/2 space-y-3 sm:space-y-4">
                            <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                    Upload Excel File
                                </label>
                                <div className="flex items-center justify-center w-full">
                                    <label 
                                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all"
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <svg className="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                            </svg>
                                            <p className="mb-2 text-sm text-gray-500">
                                                <span className="font-semibold">Click to upload</span> or drag and drop
                                            </p>
                                            <p className="text-xs text-gray-500">.xlsx, .xls, or .csv</p>
                                        </div>
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept=".xlsx,.xls,.csv"
                                            onChange={(e) => handleFileUpload(e)}
                                        />
                                    </label>
                                </div>
                                {fileUploadError && (
                                    <p className="mt-2 text-xs text-red-600">{fileUploadError}</p>
                                )}
                                {isLoading && (
                                    <p className="mt-2 text-xs text-blue-600">Loading numbers from file...</p>
                                )}
                            </div>

                            <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                                {/* Country Selector */}
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    Select Country
                                </label>
                                <Select
                                    options={COUNTRY_OPTIONS}
                                    value={selectedCountry}
                                    onChange={setSelectedCountry}
                                    styles={customStyles}
                                    components={{
                                        Option: CustomOption,
                                        SingleValue: CustomSingleValue
                                    }}
                                    className="mb-3"
                                    isSearchable={true}
                                    maxMenuHeight={200}
                                    openMenuOnFocus={true}
                                    blurInputOnSelect={true}
                                />

                                {/* Number Input */}
                                <label htmlFor="numbers" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    Phone Numbers (Manual or from Excel)
                                </label>
                                <textarea
                                    id="numbers"
                                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-sm"
                                    placeholder={selectedCountry.value === 'all' 
                                        ? "Enter numbers with country code (e.g., +91xxxxxxxxxx, +1xxxxxxxxxx)" 
                                        : `Enter numbers without country code (e.g., xxxxxxxxxx)`}
                                    value={numbers}
                                    onChange={(e) => {
                                        const input = e.target.value;
                                        const numbersArray = input.split(',').map(n => n.trim()).filter(n => n);
                                        if (numbersArray.length <= 100) {
                                            setNumbers(input);
                                        } else {
                                            setNumbers(numbersArray.slice(0, 100).join(', '));
                                        }
                                    }}
                                    required
                                />
                                <div className="flex justify-between mt-1 sm:mt-2">
                                    <div className="text-xs text-gray-500">
                                        {selectedCountry.value === 'all' ? (
                                            <p>Example: +919876543210, +12345678900</p>
                                        ) : (
                                            <p>Example: 9876543210 (without country code)</p>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {numbers ? numbers.split(',').filter(n => n.trim()).length : 0} numbers
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                                <label htmlFor="message" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Message Content</label>
                                <textarea
                                    id="message"
                                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-sm"
                                    placeholder="Enter your message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                    rows={4}
                                />
                            </div>

                            {/* Progress Bar */}
                            {sendingProgress.isActive && (
                                <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">
                                            Sending Progress
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {sendingProgress.current}/{sendingProgress.total}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                        <div 
                                            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${(sendingProgress.current / sendingProgress.total) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-600">
                                        <span>✅ Sent: {sendingProgress.sent}</span>
                                        <span>❌ Failed: {sendingProgress.failed}</span>
                                        <span>⏳ Pending: {sendingProgress.total - sendingProgress.current}</span>
                                    </div>
                                </div>
                            )}

                            <button
                                className="w-full py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all transform hover:scale-[1.01] shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center text-sm"
                                onClick={handleSubmit}
                                disabled={isLoading || sendingProgress.isActive}
                            >
                                {isLoading || sendingProgress.isActive ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {sendingProgress.isActive ? 'Sending Messages...' : 'Processing...'}
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                                        </svg>
                                        Send Messages
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Right Column - Status */}
                        <div className="w-full lg:w-1/2 bg-white rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all mt-3 lg:mt-0">
                            <div className="flex justify-between items-center mb-2 sm:mb-3">
                                <h3 className="text-sm sm:text-md font-semibold text-gray-800 flex items-center">
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    Message Status
                                </h3>
                            </div>

                            <div className="h-[500px] overflow-y-auto rounded-lg border border-gray-100 bg-gray-50">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center h-full p-4">
                                        <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <p className="mt-2 text-sm text-gray-600">Sending messages...</p>
                                    </div>
                                ) : messageResults.length > 0 ? (
                                    <div className="space-y-2 p-3">
                                        {status && (
                                            <div className={`p-3 rounded-lg text-sm mb-3 sticky top-0 z-10 shadow-sm ${
                                                status.includes('Error') 
                                                    ? 'bg-red-100 text-red-700 border border-red-200' 
                                                    : 'bg-green-100 text-green-700 border border-green-200'
                                            }`}>
                                                {status}
                                            </div>
                                        )}
                                        
                                        {/* Message Status Summary */}
                                        {(sendingProgress.sent > 0 || sendingProgress.failed > 0) && (
                                            <div className="bg-white rounded-lg p-3 mb-3 border border-gray-200 shadow-sm">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="text-sm font-semibold text-gray-800">Message Summary</h4>
                                                    <span className="text-xs text-gray-500">
                                                        {sendingProgress.current}/{sendingProgress.total}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="flex flex-col items-center p-2 bg-green-50 rounded-lg border border-green-200">
                                                        <span className="text-lg font-bold text-green-600">{sendingProgress.sent}</span>
                                                        <span className="text-xs text-green-700 font-medium">Sent</span>
                                                    </div>
                                                    <div className="flex flex-col items-center p-2 bg-red-50 rounded-lg border border-red-200">
                                                        <span className="text-lg font-bold text-red-600">{sendingProgress.failed}</span>
                                                        <span className="text-xs text-red-700 font-medium">Failed</span>
                                                    </div>
                                                    <div className="flex flex-col items-center p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                                                        <span className="text-lg font-bold text-yellow-600">{sendingProgress.total - sendingProgress.current}</span>
                                                        <span className="text-xs text-yellow-700 font-medium">Pending</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="divide-y divide-gray-200">
                                            {messageResults.map((result, index) => (
                                                <div key={index} 
                                                     className="py-3 px-2 flex justify-between items-center hover:bg-white transition-colors duration-150 rounded-lg">
                                                    <div className="flex items-center">
                                                        <span className={`w-2 h-2 rounded-full mr-2 ${
                                                            result.status === 'sent' ? 'bg-green-500' : 'bg-red-500'
                                                        }`}></span>
                                                        <span className="text-sm font-medium text-gray-700">{result.number}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-3">
                                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                            result.status === 'sent' 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {result.status}
                                                        </span>
                                                        <span className="text-xs text-gray-500 min-w-[60px]">{result.timestamp}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full p-4">
                                        <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                        <p className="text-gray-700 font-medium text-sm">Ready to send messages</p>
                                        <p className="text-xs text-gray-500 mt-1">Enter numbers and message to begin</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <div className="text-center w-full max-w-5xl mt-3 sm:mt-4 py-2 px-2 sm:px-4">
                <div className="text-xs text-gray-600 font-bold mb-1">DISCLAIMER: Use this service responsibly and in accordance with WhatsApp's terms of service.</div>
                <p className="text-xs text-gray-500">
                    © {new Date().getFullYear()} WhatsApp Bulk Message Sender | All Rights Reserved
                </p>
            </div>
        </div>
    );
};

export default MessageSender;


