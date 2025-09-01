import axios from "axios";
import { useState, useEffect } from "react";
import * as XLSX from 'xlsx';
import Select from 'react-select';

// API Base URL from environment variable
// const API_BASE_URL = "https://whatsapp.pizeonfly.com";
const API_BASE_URL = "http://localhost:4000";

// QR code utility functions
const generateQRCodeImage = (qrData) => {
    try {
        // Convert QR data to proper format for display
        const qrString = qrData;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = 256;
        canvas.height = 256;
        
        // Create QR code using a simple pattern (you might want to use a proper QR library)
        const cellSize = 8;
        const cells = qrString.length;
        const gridSize = Math.sqrt(cells);
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'black';
        for (let i = 0; i < cells; i++) {
            const x = (i % gridSize) * cellSize;
            const y = Math.floor(i / gridSize) * cellSize;
            if (qrString[i] === '1') {
                ctx.fillRect(x, y, cellSize, cellSize);
            }
        }
        
        return canvas.toDataURL();
    } catch (error) {
        console.error('Error generating QR code image:', error);
        return null;
    }
};

// कंपनी लोगो URL - इसे अपने लोगो के URL से बदलें
const COMPANY_LOGO = "https://crm.pizeonfly.com/Images/pizeonflylogo.png"; // अपने लोगो का URL यहाँ डालें

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
        opacity: 0,        // Hide the input but keep functionality
        height: '0px',     // Reduce space taken
        padding: '0px',    // Remove padding
        margin: '0px',     // Remove margin
        position: 'absolute' // Take it out of flow
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
        height: '32px' // Fixed height for options
    }),
    singleValue: (provided) => ({
        ...provided,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        position: 'relative', // Override absolute positioning
        transform: 'none',    // Override transform
        maxWidth: '100%'      // Allow full width
    })
};

// First create the sorted country list without 'All Countries'
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

const NumberChecker = () => {
    // Set default value to 'All Countries' option
    const [selectedCountry, setSelectedCountry] = useState(COUNTRY_OPTIONS[0]);
    const [numbers, setNumbers] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fileUploadError, setFileUploadError] = useState(null);
    const [serverStatus, setServerStatus] = useState("unknown");
    const [qrCode, setQrCode] = useState(null);
    const [showQR, setShowQR] = useState(false);
    const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

    // सर्वर स्टेटस चेक करें
    const checkServerStatus = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/whatsapp/status`, {
                timeout: 5000 // 5 second timeout
            });
            if (response.data.success) {
                const wasConnected = serverStatus === "connected";
                const isNowConnected = response.data.connected;
                
                setServerStatus(isNowConnected ? "connected" : "disconnected");
                setError(null);
                
                // If not connected, try to get QR code
                if (!isNowConnected) {
                    // Only auto-fetch QR code if we just disconnected or if QR is not already shown
                    if (!wasConnected || !showQR) {
                        await fetchQRCode();
                    }
                } else {
                    // If connected, hide QR code
                    setQrCode(null);
                    setShowQR(false);
                }
            }
        } catch (err) {
            console.error('Server status check failed:', err);
            setServerStatus("disconnected");
            setError("Cannot connect to server. Please make sure the server is running on port 4000.");
        }
    };

    // QR कोड fetch करें
    const fetchQRCode = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/whatsapp/qr`, {
                timeout: 5000
            });
            if (response.data.success && response.data.qr) {
                setQrCode(response.data);
                setShowQR(true);
            } else {
                setQrCode(null);
                setShowQR(false);
            }
        } catch (err) {
            console.error('QR code fetch failed:', err);
            setQrCode(null);
            setShowQR(false);
        }
    };

    // WhatsApp से disconnect करें
    const disconnectWhatsApp = async () => {
        try {
            setLoading(true);
            setShowDisconnectConfirm(false);
            const response = await axios.post(`${API_BASE_URL}/api/whatsapp/disconnect`, {}, {
                timeout: 10000
            });
            
            if (response.data.success) {
                setServerStatus("disconnected");
                setQrCode(null);
                setShowQR(false);
                setError(null);
                // Automatically fetch new QR code after disconnect
                setTimeout(() => {
                    fetchQRCode();
                }, 2000);
            }
        } catch (err) {
            console.error('Disconnect failed:', err);
            setError("Failed to disconnect. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Show disconnect confirmation
    const handleDisconnectClick = () => {
        setShowDisconnectConfirm(true);
    };

    // कंपोनेंट माउंट होने पर सर्वर स्टेटस चेक करें
    useEffect(() => {
        checkServerStatus();
        const interval = setInterval(checkServerStatus, 10000);
        return () => clearInterval(interval);
    }, []);

    // Excel फ़ाइल से नंबर निकालने का फंक्शन
    const extractNumbersFromExcel = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // पहली शीट का नाम प्राप्त करें
                    const firstSheetName = workbook.SheetNames[0];
                    // पहली शीट प्राप्त करें
                    const worksheet = workbook.Sheets[firstSheetName];

                    // शीट को JSON में परिवर्तित करें
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    // सभी संभावित फोन नंबर्स निकालें
                    let extractedNumbers = [];

                    jsonData.forEach(row => {
                        if (Array.isArray(row)) {
                            row.forEach(cell => {
                                // सेल को स्ट्रिंग में परिवर्तित करें और फोन नंबर खोजें
                                const cellStr = String(cell);

                                // यदि यह नंबर है या नंबर जैसा दिखता है
                                if (/\d{10,}/.test(cellStr)) {
                                    // विशेष वर्णों को हटाएं और नंबर को शुद्ध करें
                                    const cleanedNumber = cellStr.replace(/[^\d]/g, '');
                                    if (cleanedNumber.length >= 10) {
                                        extractedNumbers.push(cleanedNumber);
                                    }
                                }
                            });
                        }
                    });

                    // केवल पहले 100 नंबर भेजें (10 की जगह 100)
                    resolve(extractedNumbers.slice(0, 100));
                } catch (err) {
                    reject(err);
                }
            };

            reader.onerror = (error) => {
                reject(error);
            };

            reader.readAsArrayBuffer(file);
        });
    };

    // फ़ाइल अपलोड हैंडलर
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        setFileUploadError(null);

        if (!file) return;

        // फ़ाइल टाइप चेक करें
        const fileType = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(fileType)) {
            setFileUploadError("कृपया केवल Excel या CSV फ़ाइल अपलोड करें");
            return;
        }

        try {
            setLoading(true);
            const extractedNumbers = await extractNumbersFromExcel(file);

            if (extractedNumbers.length === 0) {
                setFileUploadError("फ़ाइल में कोई वैध नंबर नहीं मिला");
                setLoading(false);
                return;
            }

            // नंबर्स को इनपुट फील्ड में सेट करें
            setNumbers(extractedNumbers.join(', '));
            setLoading(false);

        } catch (err) {
            console.error("Excel फ़ाइल पार्स करने में त्रुटि:", err);
            setFileUploadError("फ़ाइल को पार्स करने में त्रुटि। कृपया सही फॉर्मैट वाली फ़ाइल अपलोड करें।");
            setLoading(false);
        }
    };

    // ड्रैग एंड ड्रॉप हैंडलर्स
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('border-indigo-500', 'bg-indigo-50');
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50');
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            const fileType = file.name.split('.').pop().toLowerCase();
            
            if (!['xlsx', 'xls', 'csv'].includes(fileType)) {
                setFileUploadError("कृपया केवल Excel या CSV फ़ाइल अपलोड करें");
                return;
            }

            handleFileUpload({ target: { files: [file] } });
        }
    };

    const checkNumbers = async () => {
        if (!numbers.trim()) {
            setError("Please enter at least one number");
            return;
        }

        setLoading(true);
        setError(null);
        setResults([]);

        try {
            const numbersToCheck = numbers.split(",")
                .map(num => num.trim())
                .filter(num => num.length > 0)
                .map(num => {
                    // If "All Countries" is selected, return number as is
                    if (selectedCountry.value === 'all') {
                        return num;
                    }
                    
                    // Remove any existing country code or + symbol
                    const cleanNum = num.replace(/^\+|\D/g, '');
                    
                    // If number already starts with the country code, return as is
                    if (cleanNum.startsWith(selectedCountry.code)) {
                        return cleanNum;
                    }
                    
                    // Add the selected country code
                    return selectedCountry.code + cleanNum;
                });

            console.log("Checking numbers:", numbersToCheck);

            // Create custom axios instance with increased timeout
            const axiosInstance = axios.create({
                baseURL: API_BASE_URL,
                timeout: 300000, // 5 minutes timeout
                headers: { 
                    'Content-Type': 'application/json',
                }
            });

            // Split numbers into smaller batches of 20
            const batchSize = 20;
            const batches = [];
            for (let i = 0; i < numbersToCheck.length; i += batchSize) {
                batches.push(numbersToCheck.slice(i, i + batchSize));
            }

            let allResults = [];
            
            // Process each batch
            for (let batch of batches) {
                try {
                    const response = await axiosInstance.post('/api/whatsapp/check', {
                        numbers: batch
                    });

                    if (response.data && response.data.results && Array.isArray(response.data.results)) {
                        allResults = [...allResults, ...response.data.results];
                    } else if (Array.isArray(response.data)) {
                        allResults = [...allResults, ...response.data];
                    }

                    // Update results after each batch
                    setResults(allResults);
                } catch (batchError) {
                    console.error("Error processing batch:", batchError);
                    // Continue with next batch even if current fails
                }
            }

        } catch (err) {
            console.error("❌ Error checking numbers", err);

            if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
                setError("Connection error. Please check your internet connection and try again.");
                setServerStatus("disconnected");
            } else if (err.response) {
                setError(`Server error: ${err.response.data.error || 'Unknown error'}`);
            } else {
                setError(`Error: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    // CSV डाउनलोड करने के लिए फंक्शन
    const downloadCSV = () => {
        if (!results.length) return;

        // अलग-अलग arrays में नंबर्स को सेपरेट करें
        const availableNumbers = results.filter(result => result.isOnWhatsApp)
            .map(result => result.number || result.formattedNumber);
        const nonAvailableNumbers = results.filter(result => !result.isOnWhatsApp)
            .map(result => result.number || result.formattedNumber);

        // सबसे लंबी array का साइज़ निकालें
        const maxLength = Math.max(availableNumbers.length, nonAvailableNumbers.length);

        // CSV हेडर
        let csvContent = "Available Numbers,Non-Available Numbers\n";

        // प्रत्येक रो के लिए डेटा जोड़ें
        for (let i = 0; i < maxLength; i++) {
            const availableNum = availableNumbers[i] || ""; // अगर नंबर नहीं है तो खाली स्ट्रिंग
            const nonAvailableNum = nonAvailableNumbers[i] || ""; // अगर नंबर नहीं है तो खाली स्ट्रिंग
            csvContent += `${availableNum},${nonAvailableNum}\n`;
        }

        // एक्स्ट्रा इन्फॉर्मेशन जोड़ें
        csvContent += "\nSummary:\n";
        csvContent += `Total Numbers Checked,${results.length}\n`;
        csvContent += `Available Numbers,${availableNumbers.length}\n`;
        csvContent += `Non-Available Numbers,${nonAvailableNumbers.length}\n`;

        // डाउनलोड करने के लिए ब्लॉब बनाएँ
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        // डाउनलोड लिंक बनाएँ और क्लिक करें
        const link = document.createElement("a");
        link.setAttribute("href", url);
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        link.setAttribute("download", `whatsapp_numbers_${timestamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full p-2 sm:p-4 bg-gray-50">
            {/* Header Section */}
            <div className="w-full max-w-5xl mb-2 sm:mb-4 text-center px-2">
                {/* Company Logo and Name */}
                <div className="flex items-center justify-center mb-2">
                    {/* <img src={COMPANY_LOGO} alt="Company Logo" className="h-8 sm:h-10 mr-2" /> */}
                    <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-800">
                        WhatsApp Number Checker
                    </h1>
                </div>
                
                {/* Tagline */}
                <p className="text-gray-600 max-w-4xl mx-auto text-xs sm:text-sm mb-2 sm:mb-4">
                    Instantly verify if phone numbers are registered on WhatsApp. Upload Excel files or enter numbers manually to check availability.
                </p>
                
                                 {/* Server Status Badge */}
                 <div className="flex items-center justify-center gap-2">
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
                     
                     {/* Disconnect Button - Only show when connected */}
                     {serverStatus === "connected" && (
                         <button
                             onClick={handleDisconnectClick}
                             disabled={loading}
                             className="px-2 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                             title="Disconnect current WhatsApp and connect to a different account"
                         >
                             <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                             </svg>
                             Disconnect
                         </button>
                     )}
                 </div>
                
                                 {/* QR Code Section */}
                 {showQR && qrCode && (
                     <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm max-w-sm mx-auto">
                         <div className="text-center">
                             <h3 className="text-sm font-semibold text-gray-800 mb-2">Scan QR Code to Connect WhatsApp</h3>
                             <div className="bg-white p-4 rounded-lg border border-gray-300 inline-block">
                                 <div 
                                     className="w-48 h-48 mx-auto bg-white flex items-center justify-center"
                                     dangerouslySetInnerHTML={{
                                         __html: qrCode.qr
                                     }}
                                 />
                             </div>
                             <p className="text-xs text-gray-600 mt-2">
                                 Open WhatsApp on your phone and scan this QR code
                             </p>
                             <p className="text-xs text-gray-500 mt-1">
                                 Expires in: {Math.floor(qrCode.expiresIn / 1000)}s
                             </p>
                             <div className="flex gap-2 justify-center mt-2">
                                 <button
                                     onClick={fetchQRCode}
                                     className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                                 >
                                     Refresh QR Code
                                 </button>
                                 <button
                                     onClick={() => {
                                         setShowQR(false);
                                         setQrCode(null);
                                     }}
                                     className="px-3 py-1 text-xs bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
                                 >
                                     Hide QR Code
                                 </button>
                             </div>
                             
                             {/* Disconnect Button in QR Section */}
                             <div className="mt-3 pt-3 border-t border-gray-200">
                                 <p className="text-xs text-gray-600 mb-2">Want to connect a different WhatsApp account?</p>
                                 <button
                                     onClick={handleDisconnectClick}
                                     disabled={loading}
                                     className="px-4 py-2 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
                                     title="Disconnect current WhatsApp and connect to a different account"
                                 >
                                     <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                                     </svg>
                                     Disconnect & Connect New Account
                                 </button>
                             </div>
                         </div>
                     </div>
                 )}
                 
                 {/* Show QR Code Button when not connected */}
                 {serverStatus === "disconnected" && !showQR && (
                     <div className="mt-4 text-center">
                         <button
                             onClick={fetchQRCode}
                             className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center mx-auto"
                         >
                             <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z"></path>
                             </svg>
                             Show QR Code
                         </button>
                     </div>
                                  )}
             </div>
             
             {/* Disconnect Confirmation Dialog */}
             {showDisconnectConfirm && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                     <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                         <div className="flex items-center mb-4">
                             <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                                 <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                 </svg>
                             </div>
                             <h3 className="text-lg font-semibold text-gray-900">Disconnect WhatsApp?</h3>
                         </div>
                         <p className="text-sm text-gray-600 mb-6">
                             This will disconnect your current WhatsApp account and allow you to connect a different one. 
                             You'll need to scan a new QR code to connect the new account.
                         </p>
                         <div className="flex gap-3">
                             <button
                                 onClick={() => setShowDisconnectConfirm(false)}
                                 className="flex-1 px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all"
                             >
                                 Cancel
                             </button>
                             <button
                                 onClick={disconnectWhatsApp}
                                 disabled={loading}
                                 className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                                 {loading ? 'Disconnecting...' : 'Disconnect'}
                             </button>
                         </div>
                     </div>
                 </div>
             )}
             
             <div className="w-full max-w-5xl relative">
                {/* Main Content */}
                <div className="relative">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Left Column - Input Form */}
                        <div className="w-full lg:w-1/2 space-y-3 sm:space-y-4">
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
                                    isSearchable={true}      // Keep searchable
                                    maxMenuHeight={200}
                                    openMenuOnFocus={true}   // Open menu when clicked
                                    blurInputOnSelect={true}  // Blur input after selection
                                />

                                {/* Number Input */}
                                <label htmlFor="numbers" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    Enter Phone Numbers
                                </label>
                                <input
                                    id="numbers"
                                    type="text"
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
                                />
                                <div className="flex justify-between mt-1 sm:mt-2">
                                    <div className="text-xs text-gray-500">
                                        {selectedCountry.value === 'all' ? (
                                            <p>Example: +919876543210, +12345678900</p>
                                        ) : (
                                            <p>Example: 9876543210 (without country code)</p>
                                        )}
                                    </div>
                                    <p className="text-xs font-medium text-indigo-600">
                                        {numbers ? numbers.split(',').filter(n => n.trim()).length : 0}/100 numbers
                                    </p>
                                </div>
                            </div>
                            
                            {/* Excel File Upload Section */}
                            <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                                <p className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Upload Excel or CSV File</p>
                                <label 
                                    htmlFor="excel-upload" 
                                    className="flex items-center justify-center w-full p-2 sm:p-3 border-2 border-dashed border-indigo-300 rounded-lg cursor-pointer hover:border-indigo-500 transition-all bg-blue-50 bg-opacity-70"
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <div className="flex flex-col items-center justify-center py-2 sm:py-3">
                                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                                        </svg>
                                        <p className="text-xs font-medium text-indigo-700">Drop your file here or click to browse</p>
                                        <p className="text-xs text-gray-500 mt-1">(.xlsx, .xls, .csv)</p>
                                    </div>
                                    <input 
                                        id="excel-upload" 
                                        type="file" 
                                        accept=".xlsx,.xls,.csv" 
                                        onChange={handleFileUpload} 
                                        className="hidden" 
                                    />
                                </label>
                                {fileUploadError && (
                                    <p className="mt-1 sm:mt-2 text-xs text-red-600">{fileUploadError}</p>
                                )}
                            </div>

                            <button
                                className="w-full py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all transform hover:scale-[1.01] shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center text-sm"
                                onClick={checkNumbers}
                                disabled={loading || serverStatus !== "connected"}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Checking...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                        </svg>
                                        Verify WhatsApp Numbers
                                    </>
                                )}
                            </button>

                            {error && <div className="p-2 sm:p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 shadow-sm">{error}</div>}
                        </div>

                        {/* Right Column - Results */}
                        <div className="w-full lg:w-1/2 bg-white rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all mt-3 lg:mt-0">
                            <div className="flex justify-between items-center mb-2 sm:mb-3">
                                <h3 className="text-sm sm:text-md font-semibold text-gray-800 flex items-center">
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    Results
                                </h3>
                                
                                {results.length > 0 && (
                                    <button
                                        onClick={downloadCSV}
                                        className="px-2 sm:px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center shadow-sm"
                                    >
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                        </svg>
                                        Download CSV
                                    </button>
                                )}
                            </div>
                            
                            {loading && (
                                <div className="flex flex-col items-center justify-center h-32 sm:h-48">
                                    <svg className="animate-spin h-8 w-8 sm:h-10 sm:w-10 text-indigo-500 mb-2 sm:mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <p className="text-indigo-600 font-medium text-xs sm:text-sm">Checking WhatsApp numbers...</p>
                                    <p className="text-gray-500 text-xs mt-1">This may take a moment</p>
                                </div>
                            )}
                            
                            {!loading && Array.isArray(results) && results.length > 0 && (
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm flex flex-col h-56 sm:h-64 md:h-72 lg:h-80">
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-2 sm:px-3 py-2 border-b border-gray-200 sticky top-0 z-10">
                                        <div className="flex justify-between text-xs font-medium text-gray-700">
                                            <span>Phone Number</span>
                                            <span>Status</span>
                                        </div>
                                    </div>
                                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex-grow">
                                        <ul className="divide-y divide-gray-200">
                                            {results.map((res, index) => (
                                                <li key={index} className="flex justify-between p-2 sm:p-3 hover:bg-gray-50 transition-all">
                                                    <span className="font-medium text-gray-800 text-xs sm:text-sm">{res.number || res.formattedNumber}</span>
                                                    {res.isOnWhatsApp ? (
                                                        <span className="text-green-600 font-medium flex items-center px-2 py-1 bg-green-50 rounded-full text-xs">
                                                            <svg className="w-2 h-2 sm:w-3 sm:h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                                            </svg>
                                                            Available
                                                        </span>
                                                    ) : (
                                                        <span className="text-red-600 font-medium flex items-center px-2 py-1 bg-red-50 rounded-full text-xs">
                                                            <svg className="w-2 h-2 sm:w-3 sm:h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                                                            </svg>
                                                            Not Available
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                            
                            {!loading && Array.isArray(results) && results.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-56 sm:h-64 md:h-72 lg:h-80 bg-white rounded-lg border border-gray-200">
                                    <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mb-2 sm:mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                    </svg>
                                    <p className="text-gray-700 font-medium text-xs sm:text-sm">No results to display</p>
                                    <p className="text-xs text-gray-500 mt-1 text-center px-4">Enter phone numbers or upload an Excel file to check WhatsApp availability</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <div className="text-center w-full max-w-5xl mt-3 sm:mt-4 py-2 px-2 sm:px-4">
                <div className="text-xs text-gray-600 font-bold mb-1">DISCLAIMER: We are not responsible if your WhatsApp account gets banned while using this service. Use at your own risk.</div>
                <p className="text-xs text-gray-600">
                    Powered by <span className="font-semibold">Pizeonfly</span>
                </p>
                <p className="text-xs text-gray-500">
                    © {new Date().getFullYear()} WhatsApp Number Checker | All Rights Reserved
                </p>
            </div>
        </div>
    );
};

export default NumberChecker;