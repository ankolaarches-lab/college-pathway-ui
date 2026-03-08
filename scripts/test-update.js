const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length === 2) env[parts[0].trim()] = parts[1].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function testUpdate() {
    console.log('Testing update for ID 100858...');
    const { data, error } = await supabase.from('institutions').update({ zip: '36849' }).eq('id', 100858).select();
    if (error) {
        console.error('Update Error:', error);
    } else {
        console.log('Update Success:', data);
    }
}

testUpdate();
