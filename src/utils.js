/**
 * @description Removes #0 from the end of a string (due to Discord's update of removing discriminator from usernames)
 * @param {boolean} add_at Whether to add @ at the beginning of the string. Defaults to false
 * @returns {string} The string without #0 at the end
 */
String.prototype.stripTag = function (add_at=false) {
    // Check if the string ends with #0
    if (this.endsWith('#0')) {
        // Remove the last two characters and add @ at the beginning if add_at is true
        return `${add_at ? '@' : ''}${this.slice(0, -2)}`;
    }
    // Return the string as it is
    return this;
}