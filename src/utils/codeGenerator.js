// Code snippet generator for various platforms

exports.generateWordPressSnippet = (apiUrl, productId, licenseKey) => {
  return `<?php
/**
 * License Validation Plugin
 * Generated from License SaaS
 * 
 * Add this code to your WordPress plugin or functions.php
 */

if ( ! defined( 'ABSPATH' ) ) exit;

// Configuration
define( 'LICENSE_API_URL', '${apiUrl}' );
define( 'LICENSE_PRODUCT_ID', ${productId} );
define( 'LICENSE_KEY', '${licenseKey}' );

class LicenseValidator {
  private $api_url;
  private $license_key;
  private $cache_key = 'license_validation_cache';
  private $cache_time = 86400; // 24 hours

  public function __construct() {
    $this->api_url = LICENSE_API_URL;
    $this->license_key = LICENSE_KEY;
    
    // Run validation on admin init
    add_action( 'admin_init', array( $this, 'validate_license' ) );
  }

  public function validate_license() {
    // Check cache first
    $cached = get_transient( $this->cache_key );
    if ( $cached ) {
      if ( ! $cached['valid'] ) {
        $this->deactivate_plugin();
      }
      return;
    }

    $domain = parse_url( home_url(), PHP_URL_HOST );
    $response = wp_remote_post(
      $this->api_url . '/api/licenses/validate',
      array(
        'method'      => 'POST',
        'timeout'     => 10,
        'redirection' => 5,
        'httpversion' => '1.0',
        'blocking'    => true,
        'headers'     => array(
          'Content-Type' => 'application/json',
        ),
        'body'        => wp_json_encode( array(
          'licenseKey' => $this->license_key,
          'domain'     => $domain,
        ) ),
      )
    );

    if ( is_wp_error( $response ) ) {
      // API error - cache for shorter time
      set_transient( $this->cache_key, array( 'valid' => true ), 3600 );
      return;
    }

    $body = json_decode( wp_remote_retrieve_body( $response ), true );
    set_transient( $this->cache_key, $body, $this->cache_time );

    if ( ! isset( $body['valid'] ) || ! $body['valid'] ) {
      $this->deactivate_plugin();
    }
  }

  private function deactivate_plugin() {
    add_action( 'admin_notices', function() {
      echo '<div class="notice notice-error"><p>';
      echo 'License validation failed. Plugin has been deactivated.';
      echo '</p></div>';
    } );

    deactivate_plugins( plugin_basename( __FILE__ ) );
  }
}

// Initialize
new LicenseValidator();
?>`;
};

exports.generateGenericPhpSnippet = (apiUrl, productId, licenseKey) => {
  return `<?php
/**
 * Generic License Validator
 * Generated from License SaaS
 * 
 * Include this file in your project and call validate_license()
 */

class LicenseValidator {
  private $api_url = '${apiUrl}';
  private $license_key = '${licenseKey}';
  private $product_id = ${productId};
  private $cache_file;

  public function __construct() {
    $this->cache_file = sys_get_temp_dir() . '/license_cache_' . md5($this->license_key) . '.json';
  }

  public function validate($domain = null) {
    if ( !$domain ) {
      $domain = parse_url( isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : '', PHP_URL_HOST );
    }

    // Check cache
    if ( file_exists( $this->cache_file ) ) {
      $cache = json_decode( file_get_contents( $this->cache_file ), true );
      if ( isset( $cache['expires'] ) && $cache['expires'] > time() ) {
        return $cache['valid'];
      }
    }

    // Validate with API
    $result = $this->call_api( $domain );
    
    // Cache result
    file_put_contents( $this->cache_file, json_encode( array(
      'valid'   => $result,
      'expires' => time() + 86400, // 24 hours
    ) ) );

    return $result;
  }

  private function call_api( $domain ) {
    $ch = curl_init();
    curl_setopt_array( $ch, array(
      CURLOPT_URL            => $this->api_url . '/api/licenses/validate',
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_POST           => true,
      CURLOPT_POSTFIELDS    => json_encode( array(
        'licenseKey' => $this->license_key,
        'domain'     => $domain,
      ) ),
      CURLOPT_HTTPHEADER    => array( 'Content-Type: application/json' ),
      CURLOPT_TIMEOUT       => 10,
    ) );

    $response = curl_exec( $ch );
    $http_code = curl_getinfo( $ch, CURLINFO_HTTP_CODE );
    curl_close( $ch );

    if ( $http_code !== 200 ) {
      return false;
    }

    $result = json_decode( $response, true );
    return isset( $result['valid'] ) ? $result['valid'] : false;
  }
}

// Usage:
// $validator = new LicenseValidator();
// if ( !$validator->validate() ) {
//   die( 'Invalid license' );
// }
?>`;
};

exports.generateJavaScriptSnippet = (apiUrl, productId, licenseKey) => {
  return `/**
 * License Validator JavaScript Library
 * Generated from License SaaS
 * 
 * Usage in browser:
 * const validator = new LicenseValidator('${apiUrl}', '${licenseKey}');
 * validator.validate('yourdomain.com').then(isValid => {
 *   if (!isValid) console.error('Invalid license');
 * });
 */

class LicenseValidator {
  constructor(apiUrl, licenseKey) {
    this.apiUrl = apiUrl;
    this.licenseKey = licenseKey;
    this.cacheKey = 'license_cache_' + this.hashCode(licenseKey);
    this.cacheDuration = 86400000; // 24 hours in ms
  }

  async validate(domain = null) {
    if (!domain) {
      domain = window.location.hostname;
    }

    // Check cache
    const cached = this.getFromCache();
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(this.apiUrl + '/api/licenses/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licenseKey: this.licenseKey,
          domain: domain,
        }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const isValid = data.valid === true;

      this.saveToCache(isValid);
      return isValid;
    } catch (error) {
      console.error('License validation error:', error);
      return false;
    }
  }

  getFromCache() {
    const cached = localStorage.getItem(this.cacheKey);
    if (!cached) return null;

    const { valid, expires } = JSON.parse(cached);
    if (expires < Date.now()) {
      localStorage.removeItem(this.cacheKey);
      return null;
    }

    return valid;
  }

  saveToCache(isValid) {
    localStorage.setItem(
      this.cacheKey,
      JSON.stringify({
        valid: isValid,
        expires: Date.now() + this.cacheDuration,
      })
    );
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LicenseValidator;
}`;
};

exports.generatePythonSnippet = (apiUrl, productId, licenseKey) => {
  return `"""
License Validator Python Library
Generated from License SaaS

Usage:
    validator = LicenseValidator('${apiUrl}', '${licenseKey}')
    if not validator.validate('yourdomain.com'):
        raise Exception('Invalid license')
"""

import requests
import json
import hashlib
import time
from pathlib import Path
import tempfile

class LicenseValidator:
    def __init__(self, api_url, license_key):
        self.api_url = api_url
        self.license_key = license_key
        self.cache_duration = 86400  # 24 hours
        self.cache_file = Path(tempfile.gettempdir()) / f"license_cache_{hashlib.md5(license_key.encode()).hexdigest()}.json"

    def validate(self, domain=None):
        """Validate license key"""
        if domain is None:
            domain = "localhost"

        # Check cache
        cached = self._get_cache()
        if cached is not None:
            return cached

        try:
            response = requests.post(
                f"{self.api_url}/api/licenses/validate",
                json={
                    "licenseKey": self.license_key,
                    "domain": domain,
                },
                timeout=10
            )

            if response.status_code != 200:
                return False

            data = response.json()
            is_valid = data.get("valid", False)
            
            self._save_cache(is_valid)
            return is_valid

        except Exception as e:
            print(f"License validation error: {e}")
            return False

    def _get_cache(self):
        """Get cached validation result"""
        try:
            if self.cache_file.exists():
                with open(self.cache_file, 'r') as f:
                    cache = json.load(f)
                    if cache.get('expires', 0) > time.time():
                        return cache.get('valid')
                    else:
                        self.cache_file.unlink()
        except Exception:
            pass
        return None

    def _save_cache(self, is_valid):
        """Save validation result to cache"""
        try:
            with open(self.cache_file, 'w') as f:
                json.dump({
                    'valid': is_valid,
                    'expires': time.time() + self.cache_duration
                }, f)
        except Exception:
            pass
`;
};

exports.generateCSharpSnippet = (apiUrl, productId, licenseKey) => {
  return `using System;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;

/**
 * License Validator C# Library
 * Generated from License SaaS
 */
public class LicenseValidator
{
    private string _apiUrl = "${apiUrl}";
    private string _licenseKey = "${licenseKey}";
    private static HttpClient _httpClient = new HttpClient();

    public async Task<bool> ValidateAsync(string domain = null)
    {
        if (string.IsNullOrEmpty(domain))
        {
            domain = Environment.MachineName;
        }

        try
        {
            var payload = new
            {
                licenseKey = _licenseKey,
                domain = domain
            };

            var content = new StringContent(
                JsonConvert.SerializeObject(payload),
                System.Text.Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.PostAsync(
                _apiUrl + "/api/licenses/validate",
                content
            );

            if (!response.IsSuccessStatusCode)
            {
                return false;
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var result = JsonConvert.DeserializeObject<dynamic>(responseContent);

            return result["valid"] == true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"License validation error: {ex.Message}");
            return false;
        }
    }

    // Usage:
    // var validator = new LicenseValidator();
    // bool isValid = await validator.ValidateAsync();
    // if (!isValid) throw new Exception("Invalid license");
}`;
};
